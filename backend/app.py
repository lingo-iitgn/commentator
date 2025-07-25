import time
import os
import csv
import json
import numpy as np
import pandas as pd
import pymongo
from flask import Flask, jsonify, redirect, request, session, send_file
from flask_session import Session
from flask_cors import CORS, cross_origin
from passlib.hash import sha256_crypt
from functools import wraps
from pydantic import BaseModel
from dotenv import load_dotenv
from collections import Counter
from sklearn.metrics import cohen_kappa_score
from statsmodels.stats.inter_rater import fleiss_kappa
from codeswitch.codeswitch import POS, NER
from LID_tool.getLanguage import langIdentify
from groq import Groq
from openai import OpenAI
import anthropic



app = Flask(__name__)

# cors = CORS(app, resources={
#             r"/register": {"origins": "*"}}, static_folder='../frontend/build')

CORS(app, 
     origins=["http://localhost:3000"],  
     allow_headers=["Content-Type", "Authorization"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config.from_pyfile('config.py')
Session(app)

sess = Session()
sess.init_app(app)

frontend = 'http://localhost:3000' # replace with your frontend URL

conn_str = "mongodb://127.0.0.1:27017/"

# set a 5-second connection timeout
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)

database = client['sentences_EMNLP24']

try:
    print("\nConnected to the db.\n")
except Exception:
    print("Unable to connect to the server.")


@app.route('/test', methods=['GET'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def test():
    return jsonify({'result': 'Hello World'})


@app.route('/signup', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def register():
    user_collection = database["users"]
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])
    username = requestdata['username']
    password = sha256_crypt.encrypt(str(requestdata['password']))
    print(username, password)
    print(database.list_collection_names())

    result = user_collection.find({'username': username})
    res = list(result)
    print('Res: ', res, '\tType: ', type(res))
    print(res.__len__())
    if res.__len__() > 0:
        return jsonify({"error_message": "The username has already been taken"})
    else:
        user_collection.insert_one(
            {'username': username, 'password': password, 'admin': False})

        result = {
            'username': username,
            'password': password,
            'message': "Your account has been created. Please Login!"
        }
        print(client.list_database_names())
        return jsonify({'result': result})

def init_db():
    user_collection = database["users"]
    
    predefined_users = [
        {
            "username": "admin",
            "password": sha256_crypt.hash("admin"),
            "admin": True
        },
        {
            "username": "commentator",
            "password": sha256_crypt.hash("commentator"),
            "admin": False
        }
    ]
    
    for user in predefined_users:
        if not user_collection.find_one({"username": user["username"]}):
            user_collection.insert_one(user)
            print(f"Created predefined user: {user['username']}")

@app.route('/login', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def login():
    user_collection = database.get_collection('users')
    lid_collection = database["lid"]  
    pos_collection = database["pos"]
    matrix_collection = database["matrix"]
    ner_collection = database["ner"]
    translation_collection = database["translation"]
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    username = requestdata['username']
    password = str(requestdata['password'])
    print(username, password)

    result = user_collection.find({'username': username})
    res = list(result)
    print('Res: ', res, '\tType: ', type(res))
    print(res.__len__())
    sentId = None
    pos_id = None
    mat_id = None
    ner_id = None
    trans_id = None

    if res:
        data = res[0]
        print(data['password'])
        admin = data.get('admin', False)
        
        if sha256_crypt.verify(password, data['password']):
            session['logged_in'] = True
            session['username'] = username
            session['user_id'] = data['_id']
        else:
            error = 'Invalid Password'
            return jsonify({'error': error}), 401
    else:
        error = 'Username not found'
        return jsonify({'error': error}), 404

    lid_result = lid_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    pos_result = pos_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    mat_result = matrix_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    ner_result = ner_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    trans_result = translation_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    
    
    if lid_result:
        sentId = lid_result.get('sentId', 0) + 1
        session['sentId'] = sentId
        sentTag = lid_result.get('sentTag', [])
        lid_collection.update_one({'_id': lid_result['_id']}, {'$set': {'sentTag': sentTag}})
    else:
        sentId = 0
        lid_collection.insert_one({'user_id': session['user_id'], 'username': username, 'sentId': sentId, 'sentTag': []})
        session['sentId'] = sentId

    if pos_result:
        pos_id = pos_result.get('pos_id', 0) 
        session['pos_id'] = pos_id
        posTag = pos_result.get('posTag', [])
        pos_collection.update_one({'_id': pos_result['_id']}, {'$set': {'posTag': posTag}})
    else:
        pos_id = 0
        pos_collection.insert_one({'user_id': session['user_id'], 'username': username, 'pos_id': pos_id, 'posTag': []})
        session['pos_id'] = pos_id

    if mat_result:
        mat_id = mat_result.get('mat_id', 0) + 1
        session['mat_id'] = mat_id
        matrixTag = mat_result.get('matrixTag', [])
        matrix_collection.update_one({'_id': mat_result['_id']}, {'$set': {'matrixTag': matrixTag}})
    else:
        mat_id = 0
        matrix_collection.insert_one({'user_id': session['user_id'], 'username': username, 'mat_id': mat_id, 'matrixTag': []})
        session['mat_id'] = mat_id

    if ner_result:
        ner_id = ner_result.get('ner_id', 0) 
        session['ner_id'] = ner_id
        nerTag = ner_result.get('nerTag', [])
        ner_collection.update_one({'_id': ner_result['_id']}, {'$set': {'nerTag': nerTag}})
    else:
        ner_id = 0
        ner_collection.insert_one({'user_id': session['user_id'], 'username': username, 'ner_id': ner_id, 'nerTag': []})
        session['ner_id'] = ner_id
    
    if trans_result:
        trans_id = trans_result.get('trans_id', 0) 
        session['trans_id'] = trans_id
        transTag = trans_result.get('transTag', [])
        translation_collection.update_one({'_id': ner_result['_id']}, {'$set': {'transTag': transTag}})
    else:
        trans_id = 0
        translation_collection.insert_one({'user_id': session['user_id'], 'username': username, 'trans_id': trans_id, 'transTag': []})
        session['trans_id'] = trans_id

    returning = {
        'username': session['username'],
        'admin': admin,
        'sentId': sentId,
        'pos_id': pos_id,
        'mat_id' : mat_id,
        'ner_id' : ner_id,
        'trans_id' : trans_id,
    }

    return jsonify({'success': returning, 'username': session['username'], 'sentId': sentId, 'pos_id': pos_id, 'mat_id': mat_id,  'ner_id' : ner_id, 'trans_id' : trans_id})
def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return jsonify({'message': "You are not logged in!"})
    return wrap


@app.route('/logout', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def logout():
    session.clear()
    return jsonify({'message': "You are logged out"})
        
@app.route('/get-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type'])
def get_sentence():
    sentences_collection = database["sentences"]
    requestdata = json.loads(request.data)
    print("request", requestdata)
    sentId = requestdata['sentId']
    print("sentId",sentId)

    result = sentences_collection.find({'sentId': sentId})
    data = list(result)

    if data: 
        data = data[0]
        sentence = data['sentence']
        sentId = data['sentId']
        tags = data['tags']

        result = {
            'sentence': sentence,
            'sentId': sentId,
            'tags': tags,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})


@app.route('/get-p-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type'])
def get_p_sentence():
    sentences_collection = database["sentences"]
    
    requestdata = json.loads(request.data)
    print("request", requestdata)
    pos_id = requestdata.get('pos_id')  
    print("pos_id", pos_id)

    if pos_id is None:
        return jsonify({'error': "No pos_id provided"}), 400  

    sentence_result = sentences_collection.find_one({'pos_id': pos_id})

    if sentence_result:
        sentence = sentence_result.get('sentence')
        pos_tags = sentence_result.get('pos_tags', [])
        
        result = {
            'sentence': sentence,
            'pos_id': pos_id,
            'pos_tags': pos_tags,
            'message': "Sentence and POS tags fetched successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided pos_id"}), 404

@app.route('/get-n-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type'])
def get_n_sentence():
    sentences_collection = database["sentences"]
    requestdata = json.loads(request.data)
    # print("request", requestdata)
    ner_id = requestdata['ner_id']
    print("ner_id",ner_id)

    result = sentences_collection.find({'ner_id': ner_id})
    data = list(result)

    if data: 
        data = data[0]
        sentence = data['sentence']
        ner_id = data['ner_id']
        ner_tags = data['ner_tags']

        result = {
            'sentence': sentence,
            'ner_id': ner_id,
            'ner_tags': ner_tags,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})


@app.route('/get-m-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type'])
def get_m_sentence():
    sentences_collection = database["sentences"]
    requestdata = json.loads(request.data)
    # print("request", requestdata)
    mat_id = requestdata['mat_id']
    print("mat_id",mat_id)

    result = sentences_collection.find({'mat_id': mat_id})
    data = list(result)

    if data: 
        data = data[0]
        sentence = data['sentence']
        mat_id = data['mat_id']

        result = {
            'sentence': sentence,
            'mat_id': mat_id,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})

@app.route('/get-t-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type'])
def get_t_sentence():
    sentences_collection = database["sentences"]
    requestdata = json.loads(request.data)
    print("request", requestdata)
    trans_id = requestdata['trans_id']
    print("trans_id",trans_id)

    result = sentences_collection.find({'trans_id': trans_id})
    data = list(result)
    # print("data", data)

    if data: 
        data = data[0]
        # print("data", data)
        sentence = data['sentence']
        trans_id = data['trans_id']

        result = {
            'sentence': sentence,
            'trans_id': trans_id,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})

@app.route('/get-lid-data', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])

def lid_tag():
    try:
        requestdata = json.loads(request.data)
        requestdata = json.loads(requestdata['body'])
        sentId = requestdata['sentId']

        lid_collection = database["lid"]
        tags = lid_collection.find_one({'sentId': sentId}, {'_id': 0, 'sentTag': 1})

        return jsonify({'result': tags['sentTag'] if tags else []})
        
    except Exception as e:
        return jsonify({'error': str(e)})


from bson.objectid import ObjectId

@app.route('/admin-file-upload', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def admin_file_upload():
    print(request.files['file'])
    file = request.files['file']
    file.save('uploads/{}'.format(file.filename))

    sentences_collection = database.get_collection('sentences')

    filename = file.filename
    df = pd.read_csv(f'uploads/{filename}', header=None, on_bad_lines='skip')
    df = df.iloc[:, 0]
    print(df)
    load_dotenv()

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    class TranslationResult(BaseModel):
        # hinglish: str
        english: str
        romanized_hindi: str
        devnagarish: str

    def translate_with_llm(text: str, target_language: str) -> str:
        if target_language == "Romanized Hindi":
            prompt = (
                f"Translate this to {target_language} (write in Roman script):\n"
                f"{text}, only give translations to the given text and don't add explanations or extra text."
            )
        else:
            prompt = f"Translate this to {target_language}:\n{text}, only give translations to the given text and don't add explanations or extra text."

        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0
        )
        response = chat_completion.choices[0].message.content.strip()
        return response.split("\n")[0].strip()
    
    ##### OPENAI API Integration for the Translation task #####

    # os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

    # # Initialize OpenAI client
    # client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # # TranslationResult model
    # class TranslationResult(BaseModel):
    #     english: str
    #     romanized_hindi: str
    #     devnagarish: str

    # # Translate text with LLM
    # def translate_with_llm(text: str, target_language: str) -> str:
    #     if target_language == "Romanized Hindi":
    #         prompt = (
    #             f"Translate this to {target_language} (write in Roman script):\n"
    #             f"{text}, please only give translations to the given text and don't add explanations."
    #         )
    #     elif target_language == "Devanagari Hindi":
    #         prompt = (
    #             f"Translate this to {target_language} (write in Devanagari script):\n"
    #             f"{text}, only give translations to the given text and don't add explanations or extra text."
    #         )
    #     else:
    #         prompt = f"Translate this to {target_language}:\n{text}, only give translations to the given text and don't add explanations or extra text."
    #     # OpenAI API request
    #     chat_completion = client.chat.completions.create(
    #         messages=[{"role": "system", "content": prompt}],
    #         model="gpt-4",
    #         temperature=0
    #     )
    #     response = chat_completion.choices[0].message.content.strip()
    #     return response.split("\n")[0].strip()

    ##### Anthropic API Integration for the Translation task #####

    # os.environ["ANTHROPIC_API_KEY"] = "YOUR_ANTHROPIC_API_KEY"

    # client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    # class TranslationResult(BaseModel):
    #     hinglish: str
    #     english: str
    #     romanized_hindi: str
    #     devnagarish: str

    # # Get completion from Claude
    # def translate_with_llm(client: anthropic.Anthropic, prompt: str) -> str:
    #         """
    #         Get completion from Claude using the Anthropic API
    #         """
    #         try:
    #             message = client.messages.create(
    #                 model="claude-3-5-sonnet-20241022",
    #                 max_tokens=1000,
    #                 temperature=0,
    #                 messages=[
    #                     {
    #                         "role": "user",
    #                         "content": prompt
    #                     }
    #                 ]
    #             )
    #             # Claude response is a list of content blocks; get the first text block
    #             return message.content[0].text
    #         except Exception as e:
    #             print(f"Error getting completion: {e}")
    #             return "Error: API call failed"

    def translate_sentence(sentence: str) -> TranslationResult:
        english_translation = translate_with_llm(sentence, "English")
        romanized_hindi = translate_with_llm(sentence, "Romanized Hindi")
        devnagarish = translate_with_llm(sentence, "Devanagari Hindi")

        return TranslationResult(
            hinglish=sentence,
            english=english_translation,
            romanized_hindi=romanized_hindi,
            devnagarish=devnagarish
        )
    # Fetch the last IDs for sentences, POS, matrix, and NER
    last_sent_id = 0
    prev_sent = list(sentences_collection.find())
    if prev_sent:
        last_sent_id = prev_sent[-1]['sentId']

    last_pos_id = 0
    prev_pos = list(sentences_collection.find())
    if prev_pos:
        last_pos_id = prev_pos[-1]['pos_id']

    last_mat_id = 0
    prev_mat = list(sentences_collection.find())
    if prev_mat:
        last_mat_id = prev_mat[-1]['mat_id']

    last_ner_id = 0
    prev_ner = list(sentences_collection.find())
    if prev_ner:
        last_ner_id = prev_ner[-1]['ner_id']
    
    last_trans_id = 0
    prev_trans = list(sentences_collection.find())
    if prev_trans:
        last_trans_id = prev_trans[-1]['trans_id']

    text = df.tolist()
    print(text)

    pos = POS('hin-eng')
    pos_tags = pos.tag(text)
    # print(pos_tags)

    ner = NER('hin-eng')
    ner_tags = ner.tag(text)
    # print(ner_tags)

    # def clean_token(token):
    #     return token.replace('\\"', '"').replace('\\', '').strip('"')

    for idx, sentence in enumerate(df):
        last_sent_id += 1
        last_pos_id += 1
        last_mat_id += 1
        last_ner_id += 1
        last_trans_id += 1

        # print(sentence)
        translation_result = translate_sentence(sentence)
        
        tokens = sentence.split()

        aligned_ner_tags = ner_tags[idx]
        combined_ner_tags = []
        used_words = set()
        current_word = ""
        current_entity = None

        for tag in aligned_ner_tags:
            word = tag['word']
            entity = tag['entity'] if tag['entity'] else "X"

            if word.startswith("##"):  
                current_word += word[2:]
            else:
                if current_word:  
                    combined_ner_tags.append({"word": current_word, "entity": current_entity})
                    used_words.add(current_word)
                current_word = word
                current_entity = entity

        if current_word:
            combined_ner_tags.append({"word": current_word, "entity": current_entity})
            used_words.add(current_word)

        final_ner_tags = []
        for token in tokens:
            if token in used_words:
                for tag in combined_ner_tags:
                    if tag['word'] == token:
                        final_ner_tags.append(tag)
                        break
            else:
                # Assign 'X' if the token wasn't used in CodeSwitch predictions
                final_ner_tags.append({"word": token, "entity": "X"})

        print(final_ner_tags)

        sentences_collection.insert_one({
            "sentence": sentence,
            "sentId": last_sent_id,
            "pos_id": last_pos_id,
            "mat_id": last_mat_id,
            "ner_id": last_ner_id,
            "trans_id": last_trans_id,
            "tags": [],
            "pos_tags": json.dumps(pos_tags[idx], cls=NpEncoder),
            "ner_tags": json.dumps(final_ner_tags, cls=NpEncoder),
            "eng_tags": translation_result.english,
            "RH_tags": translation_result.romanized_hindi,
            "DH_tags": translation_result.devnagarish
        })

        # Perform language identification
        lang = langIdentify(sentence, 'classifiers/HiEn.classifier')
        tags = []

        for elem in lang:
            inter = [elem[0]]
            for i in range(1, len(elem)):
                if elem[i] == '1':
                    inter.append(elem[i-1][0])
            if len(inter) == 1:
                inter.append('h')
            tags.append(inter)

        sentences_collection.update_one({'sentence': sentence}, {'$set': {'tags': tags}})

    print('Task Finished')

    return redirect('{}/admin'.format(frontend))


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            # 👇️ alternatively use str()
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

@app.route('/fetch-pos-sent', methods=['POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_pos_sent():
    start = time.time()

    pos_collection = database.get_collection('sentences')
    requestdata = request.get_json(force=True)
    pos_id = requestdata.get('pos_id')

    pos = pos_collection.find_one({'pos_id': int(pos_id) + 1})
    result = [[pos['sentence'], pos['pos_tags']]] if pos else []

    print("Time taken:", time.time() - start)
    return jsonify({'result': result})

@app.route('/fetch-ner-sent', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_ner_sent():
    ner_collection = database.get_collection('sentences')
    ner_list = ner_collection.find({})
    ner_list = list(ner_list)
    # print(ner_list)
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    ner_id = requestdata['ner_id']
    print("ner_id received:", ner_id)

    ner_list_gen = []
    for ner in ner_list:
        if (ner['ner_id'] == int(ner_id) + 1):
            ner_list_gen.append([ner['sentence'], ner['ner_tags']])
            break

    # print("ner_list_gen:", ner_list_gen)
    return jsonify({'result': ner_list_gen})

@app.route('/fetch-translation-sent', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_trans_sent():
    translation_collection = database.get_collection('sentences')
    translation_list = translation_collection.find({})
    translation_list = list(translation_list)
    requestdata = json.loads(request.data)
    # print("Request data:", requestdata)
    requestdata = json.loads(requestdata['body'])

    trans_id = requestdata['trans_id']
    print("trans_id received:", trans_id)

    translation_list_gen = []
    for trans in translation_list:
        if trans['trans_id'] == int(trans_id) + 1:
            translation_list_gen.append({
                "sentence": trans['sentence'],
                "eng_tags": trans['eng_tags'],
                "RH_tags": trans['RH_tags'],
                "DH_tags": trans['DH_tags']
            })
            break

    return jsonify({'result': translation_list_gen})

@app.route('/sentence-schema-creation', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def sentence_schema_creation():
    try:
        database.create_collection('users')
    except:
        print("Already exists")
    try:
        database.create_collection('sentences')
    except:
        print("Already exists")
    try:
        database.create_collection('lid')
    except:
        print("Already exists")
    try:
        database.create_collection('matrix')
    except:
        print("Already exists")
    try:
        database.create_collection('pos')
    except:
        print("Already exists")
    try:
        database.create_collection('ner')
    except:
        print("Already exists")
    try:
        database.create_collection('translation')
    except:
        print("Already exists")

    print('Schemas Created')
    return redirect('{}/admin'.format(frontend))


@app.route('/fetch-users-list', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_users_list():
    user_collection = database.get_collection('users')
    
    user_list = user_collection.find({
        '$or': [
            {'admin': {'$ne': True}},      
            {'admin': {'$exists': False}}  
        ]
    })
    
    user_list = list(user_list)

    users_list = []
    for user in user_list:
        users_list.append(user['username'])
    print(users_list)

    return jsonify({'result': users_list})


@app.route('/csv-download', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def csv_download():
    from flask import send_file
    import csv

    username = request.form.get('username')
    cmi = request.form.get('cmi')
    os.makedirs('csv', exist_ok=True)

    file_type = request.form.get('file_type')

    lid_file = pos_file = matrix_file = ner_file = translation_file = None

    if username and username != 'ALL':
        lid_collection = database.get_collection('lid')
        pos_collection = database.get_collection('pos')
        matrix_collection = database.get_collection('matrix')
        ner_collection = database.get_collection('ner')
        translation_collection = database.get_collection('translation')

        user = lid_collection.find_one({'username': username})
        if user:
            sentTag = user.get('sentTag', [])
            lid_file = f'csv/{username}_lid.csv'
            with open(lid_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'lid tags', 'link', 'hashtag', 'time', 'feedback', 'CMI Score'])
                for sentence in sentTag:
                    date = sentence[0]
                    tag = sentence[1]
                    link = sentence[2]
                    hashtag = sentence[3] if sentence[4] else []
                    time = sentence[4]
                    feedback = sentence[5]
                    row = [date, tag, link, hashtag, time, feedback]

                    en_count = 0
                    hi_count = 0
                    token_count = 0
                    lang_ind_count = 0

                    for i in range(len(tag)):
                        if tag[i]['value'] == 'e':
                            en_count += 1
                        elif tag[i]['value'] == 'h':
                            hi_count += 1
                        elif tag[i]['value'] == 'u':
                            lang_ind_count += 1
                        token_count += 1

                    max_w = max(en_count, hi_count)

                    cmi_score = 0
                    if token_count > lang_ind_count:
                        cmi_score = 100 * (1 - (max_w / (token_count - lang_ind_count)))
                    else:
                        cmi_score = 0

                    if cmi_score >= float(cmi):
                        row.append(cmi_score)
                        writer.writerow(row)

        user = pos_collection.find_one({'username': username})
        if user:
            posTag = user.get('posTag', [])
            pos_file = f'csv/{username}_pos.csv'
            with open(pos_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'time', 'pos tags', 'feedback'])
                for sentence in posTag:
                    date = sentence[0]
                    time = sentence[1]
                    tags = sentence[2]
                    feedback = sentence[3]
                    row = [date, time, tags, feedback]
                    writer.writerow(row)

        user = matrix_collection.find_one({'username': username})
        if user:
            matrixTag = user.get('matrixTag', [])
            matrix_file = f'csv/{username}_matrix.csv'
            with open(matrix_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['tags', 'date', 'time', 'feedback'])
                for sentence in matrixTag:
                   tags = sentence[0]
                   date = sentence[1]
                   time = sentence[2]
                   row = [tags, date, time]
                   writer.writerow(row)
                   print(sentence)

        user = ner_collection.find_one({'username': username})
        if user:
            nerTag = user.get('nerTag', [])
            ner_file = f'csv/{username}_ner.csv'
            with open(ner_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'time', 'ner tags', 'feedback'])
                for sentence in nerTag:
                    date = sentence[0]
                    time = sentence[1]
                    tags = sentence[2]
                    feedback = sentence[3]
                    if len(sentence) > 3:
                        feedback = sentence[3]
                    else:
                        feedback = None 
                    row = [date, time, tags, feedback]
                    writer.writerow(row)

        user = translation_collection.find_one({'username': username})
        if user:
            trans_tags = user.get('transTag', [])
            translation_file = f'csv/{username}_translation.csv'
            with open(translation_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'time', 'sentences','eng_tags', 'RH_tags', 'DH_tags', 'feedback'])
                for tag in trans_tags:
                    if len(tag) >= 6:  
                        date = tag[0]
                        time = tag[1]
                        sentences = tag[2]
                        eng_tags = tag[3]
                        RH_tags = tag[4]
                        DH_tags = tag[5]
                        feedback = tag[6] 
                        row = [date, time, sentences, eng_tags, RH_tags, DH_tags, feedback]
                        writer.writerow(row)
                    else:
                        print(f"Invalid tag format: {tag}")


        if file_type == 'lid' and lid_file:
            return send_file(lid_file, as_attachment=True)
        elif file_type == 'pos' and pos_file:
            return send_file(pos_file, as_attachment=True)
        elif file_type == 'matrix' and matrix_file:
            return send_file(matrix_file, as_attachment=True)
        elif file_type == 'ner' and ner_file:
            return send_file(ner_file, as_attachment=True)
        elif file_type == 'translation' and translation_file:
            return send_file(translation_file, as_attachment=True)
        else:
            return "File not found", 404

    elif username == 'ALL':
        pos_collection = database.get_collection('pos')
        lid_collection = database.get_collection('lid')
        matrix_collection = database.get_collection('matrix')
        ner_collection = database.get_collection('ner')
        translation_collection = database.get_collection('translation')

        # Process all users in POS collection
        all_users_pos = pos_collection.find()
        pos_file = 'csv/all_pos.csv'
        with open(pos_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'date', 'time', 'pos tags', 'feedback'])
            for user in all_users_pos:
                username = user['username']
                posTag = user.get('posTag', [])
                for sentence in posTag:
                    date = sentence[0]
                    time = sentence[1]
                    tags = sentence[2]
                    feedback = sentence[3]
                    row = [username, date, time, tags, feedback]
                    writer.writerow(row)

        # Process all users in LID collection
        all_users_lid = lid_collection.find()
        lid_file = 'csv/all_lid.csv'
        with open(lid_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'date', 'lid tags', 'link', 'hashtag', 'time', 'feedback', 'CMI Score'])
            for user in all_users_lid:
                username = user['username']
                sentTag = user.get('sentTag', [])
                for sentence in sentTag:
                    date = sentence[0]
                    tag = sentence[1]
                    link = sentence[2]
                    hashtag = sentence[3] if sentence[4] else []
                    time = sentence[4]
                    feedback = sentence[5]
                    row = [username, date, tag, link, hashtag, time, feedback]

                    en_count = 0
                    hi_count = 0
                    token_count = 0
                    lang_ind_count = 0

                    for i in range(len(tag)):
                        if tag[i]['value'] == 'e':
                            en_count += 1
                        elif tag[i]['value'] == 'h':
                            hi_count += 1
                        elif tag[i]['value'] == 'u':
                            lang_ind_count += 1
                        token_count += 1

                    max_w = max(en_count, hi_count)

                    cmi_score = 0
                    if token_count > lang_ind_count:
                        cmi_score = 100 * (1 - (max_w / (token_count - lang_ind_count)))
                    else:
                        cmi_score = 0

                    if cmi_score >= float(cmi):
                        row.append(cmi_score)
                        writer.writerow(row)

        # Process all users in Matrix collection
        all_users_matrix = matrix_collection.find()
        matrix_file = 'csv/all_matrix.csv'
        with open(matrix_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'tags', 'date', 'time', 'feedback'])
            for user in all_users_matrix:
                username = user['username']
                matrix_data = user.get('matrixTag', [])
                for sentence in matrix_data:
                    tags = sentence[0]
                    date = sentence[1]
                    time = sentence[2]
                    feedback = sentence[3] if len(sentence) > 3 else None
                    row = [username, tags, date, time, feedback]
                    writer.writerow(row)

        all_users_ner = ner_collection.find()
        ner_file = 'csv/all_ner.csv'
        with open(ner_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'date', 'time', 'tag', 'feedback'])
            for user in all_users_ner:
                username = user['username']
                nerTag = user.get('nerTag', [])
                for sentence in nerTag:
                    date = sentence[0]
                    time = sentence[1]
                    tags = sentence[2]
                    feedback = sentence[3] if len(sentence) > 3 else None
                    row = [username, date, time, tags, feedback]
                    writer.writerow(row)

        all_user_translation = translation_collection.find()
        translation_file = 'csv/all_translation.csv'
        with open(translation_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'date', 'time', 'sentences', 'eng_tags', 'RH_tags', 'DH_tags', 'feedback'])
            for user in all_user_translation:
                username = user['username']
                trans_tags = user.get('transTag', [])
                for sentence in trans_tags:
                    if len(sentence) >= 5:  
                        date = sentence[0]
                        time = sentence[1]
                        sentences = sentence[2]
                        eng_tags = sentence[2]
                        RH_tags = sentence[3]
                        DH_tags = sentence[4]
                        feedback = sentence[5] if len(sentence) > 5 else None
                        row = [username, date, time, sentences, eng_tags, RH_tags, DH_tags, feedback]
                        writer.writerow(row)
                    else:
                        print(f"Invalid tag format: {sentence}")

        # Return the requested file
        if file_type == 'pos':
            return send_file(pos_file, as_attachment=True)
        elif file_type == 'lid':
            return send_file(lid_file, as_attachment=True)
        elif file_type == 'matrix':
            return send_file(matrix_file, as_attachment=True)
        elif file_type == 'ner':    
            return send_file(ner_file, as_attachment=True)
        elif file_type == 'translation':
            return send_file(translation_file, as_attachment=True)
        else:
            return "File not found", 404

    return "Invalid request", 400


@app.route('/submit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_sentence():
    lid_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentId = requestdata.get('sentId', None)
    tag = requestdata.get('tag', None)
    username = requestdata.get('username', None)
    date = requestdata.get('date', None)
    hypertext = requestdata.get('hypertext', None)
    hashtags = requestdata.get('hashtags', None)
    timeDifference = requestdata.get('timeDifference', None)
    feedback = requestdata.get('feedback', None)

    new_entry = [date, tag, hypertext, hashtags, timeDifference, feedback]
    
    if any(new_entry):
        user_data = lid_collection.find_one({'username': username})

        if user_data:
            for entry in user_data.get('sentTag', []):
                if (
                    entry[1] == date and  
                    entry[5] == timeDifference and  
                    json.dumps(entry[2], sort_keys=True) == json.dumps(tag, sort_keys=True)  # tag comparison (index 2)
                ):
                    return jsonify({'result': 'Duplicate Entry. Not Stored.'})

            lid_collection.update_one({'username': username}, {
                '$set': {'sentId': sentId},
                '$push': {'sentTag': new_entry}
            })
            return jsonify({'result': 'Message Stored Successfully'})
        else:
            return jsonify({'result': 'User Not Found.'})
    else:
        return jsonify({'result': 'No valid data provided.'})

@app.route('/compare-annotators', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def compare_annotators():
    username1 = request.form.get('username1')
    username2 = request.form.get('username2')
    username3 = request.form.get('username3')  
    kappa = request.form.get('kappa')
    kappa_type = request.form.get('kappa_type', 'cohen')  
    print(username1, username2, username3, kappa, kappa_type)

    username1_name = username1
    username2_name = username2
    username3_name = username3 if username3 else None
    
    print('username1 = ', username1_name)
    print('username2 = ', username2_name)
    if username3_name:
        print('username3 = ', username3_name)

    user_collection = database.get_collection('lid')
    username1 = user_collection.find({'username': username1_name})
    username2 = user_collection.find({'username': username2_name})
    
    user1 = list(username1)
    user2 = list(username2)
    
    if username3_name:
        username3 = user_collection.find({'username': username3_name})
        user3 = list(username3)
        print('USER 3 = ', user3)
        counter = min(int(user1[0]['sentId']), int(user2[0]['sentId']), int(user3[0]['sentId']))
    else:
        counter = min(int(user1[0]['sentId']), int(user2[0]['sentId']))

    print('USER 1 = ', user1)
    print('USER 2 = ', user2)
    print(counter)

    sentTag1 = user1[0]['sentTag']
    sentTag2 = user2[0]['sentTag']
    sentTag3 = user3[0]['sentTag'] if username3_name else None

    def prepare_fleiss_data_for_statsmodels(ann1_tags, ann2_tags, ann3_tags=None):
        all_annotations = ann1_tags + ann2_tags
        if ann3_tags:
            all_annotations += ann3_tags
        all_categories = sorted(list(set(all_annotations)))
        
        n_items = len(ann1_tags)
        n_categories = len(all_categories)
        cat_to_idx = {cat: idx for idx, cat in enumerate(all_categories)}
        
        ratings_matrix = np.zeros((n_items, n_categories), dtype=int)
        
        for i in range(n_items):
            annotations = [ann1_tags[i], ann2_tags[i]]
            if ann3_tags:
                annotations.append(ann3_tags[i])
            
            for ann in annotations:
                if ann in cat_to_idx:
                    ratings_matrix[i, cat_to_idx[ann]] += 1
        
        return ratings_matrix

    if kappa_type == 'fleiss' and username3_name:
        headers = [
            'date_{}'.format(username1_name), 'tag_{}'.format(username1_name), 'link_{}'.format(username1_name), 
            'hashtag_{}'.format(username1_name), 'time_{}'.format(username1_name), '',
            'date_{}'.format(username2_name), 'tag_{}'.format(username2_name), 'link_{}'.format(username2_name), 
            'hashtag_{}'.format(username2_name), 'time_{}'.format(username2_name), '',
            'date_{}'.format(username3_name), 'tag_{}'.format(username3_name), 'link_{}'.format(username3_name), 
            'hashtag_{}'.format(username3_name), 'time_{}'.format(username3_name), '',
            'words_with_similar_annotation_all', 'total_words', 'Fleiss_Kappa'
        ]
    elif username3_name:
        headers = [
            'date_{}'.format(username1_name), 'tag_{}'.format(username1_name), 'link_{}'.format(username1_name), 
            'hashtag_{}'.format(username1_name), 'time_{}'.format(username1_name), '',
            'date_{}'.format(username2_name), 'tag_{}'.format(username2_name), 'link_{}'.format(username2_name), 
            'hashtag_{}'.format(username2_name), 'time_{}'.format(username2_name), '',
            'date_{}'.format(username3_name), 'tag_{}'.format(username3_name), 'link_{}'.format(username3_name), 
            'hashtag_{}'.format(username3_name), 'time_{}'.format(username3_name), '',
            'words_with_similar_annotation_12', 'words_with_similar_annotation_13', 'words_with_similar_annotation_23',
            'total_words', 'Cohen_Kappa_12', 'Cohen_Kappa_13', 'Cohen_Kappa_23', 'Avg_Cohen_Kappa'
        ]
    else:
        headers = [
            'date_{}'.format(username1_name), 'tag_{}'.format(username1_name), 'link_{}'.format(username1_name), 
            'hashtag_{}'.format(username1_name), 'time_{}'.format(username1_name), '',
            'date_{}'.format(username2_name), 'tag_{}'.format(username2_name), 'link_{}'.format(username2_name), 
            'hashtag_{}'.format(username2_name), 'time_{}'.format(username2_name), '',
            'words_with_similar_annotation', 'total_words', 'Cohen_Kappa_Score'
        ]

    with open('csv/IAA.csv', 'w', encoding='utf-8', newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for count in reversed(range(counter)):
            # User 1 data
            date_1 = sentTag1[count][0]
            tag_1 = sentTag1[count][1]
            link_1 = sentTag1[count][2]
            hashtag_1 = sentTag1[count][3] if len(sentTag1[count]) > 3 and sentTag1[count][3] else []
            time_1 = sentTag1[count][4] if len(sentTag1[count]) > 4 else ''

            # User 2 data
            date_2 = sentTag2[count][0]
            tag_2 = sentTag2[count][1]
            link_2 = sentTag2[count][2]
            hashtag_2 = sentTag2[count][3] if len(sentTag2[count]) > 3 and sentTag2[count][3] else []
            time_2 = sentTag2[count][4] if len(sentTag2[count]) > 4 else ''

            empty = ''

            if username3_name:
                # User 3 data
                date_3 = sentTag3[count][0]
                tag_3 = sentTag3[count][1]
                link_3 = sentTag3[count][2]
                hashtag_3 = sentTag3[count][3] if len(sentTag3[count]) > 3 and sentTag3[count][3] else []
                time_3 = sentTag3[count][4] if len(sentTag3[count]) > 4 else ''

                ann1_tags = [elem['value'] for elem in tag_1]
                ann2_tags = [elem['value'] for elem in tag_2]
                ann3_tags = [elem['value'] for elem in tag_3]
                total_words = len(tag_1)

                if kappa_type == 'fleiss':
                    # Calculate agreement for all three annotators
                    words_with_similar_annotation_all = 0
                    for index in range(total_words):
                        if ann1_tags[index] == ann2_tags[index] == ann3_tags[index]:
                            words_with_similar_annotation_all += 1

                    # Calculate Fleiss' Kappa using statsmodels
                    fleiss_ratings = prepare_fleiss_data_for_statsmodels(ann1_tags, ann2_tags, ann3_tags)
                    fleiss_score = fleiss_kappa(fleiss_ratings)

                    row = [
                        date_1, tag_1, link_1, hashtag_1, time_1, empty,
                        date_2, tag_2, link_2, hashtag_2, time_2, empty,
                        date_3, tag_3, link_3, hashtag_3, time_3, empty,
                        words_with_similar_annotation_all, total_words, fleiss_score
                    ]

                    # Filter based on Fleiss' Kappa threshold
                    if float(str(fleiss_score)) >= float(kappa):
                        writer.writerow(row)

                else:  # Cohen's Kappa for pairwise comparisons
                    words_with_similar_annotation_12 = 0
                    words_with_similar_annotation_13 = 0
                    words_with_similar_annotation_23 = 0

                    for index in range(total_words):
                        if ann1_tags[index] == ann2_tags[index]:
                            words_with_similar_annotation_12 += 1
                        if ann1_tags[index] == ann3_tags[index]:
                            words_with_similar_annotation_13 += 1
                        if ann2_tags[index] == ann3_tags[index]:
                            words_with_similar_annotation_23 += 1

                    # Calculate Cohen's Kappa for each pair
                    kappa_score_12 = cohen_kappa_score(ann1_tags, ann2_tags, labels=None, weights=None)
                    kappa_score_13 = cohen_kappa_score(ann1_tags, ann3_tags, labels=None, weights=None)
                    kappa_score_23 = cohen_kappa_score(ann2_tags, ann3_tags, labels=None, weights=None)
                    avg_kappa = (kappa_score_12 + kappa_score_13 + kappa_score_23) / 3

                    row = [
                        date_1, tag_1, link_1, hashtag_1, time_1, empty,
                        date_2, tag_2, link_2, hashtag_2, time_2, empty,
                        date_3, tag_3, link_3, hashtag_3, time_3, empty,
                        words_with_similar_annotation_12, words_with_similar_annotation_13, words_with_similar_annotation_23,
                        total_words, kappa_score_12, kappa_score_13, kappa_score_23, avg_kappa
                    ]

                    if float(str(avg_kappa)) >= float(kappa):
                        writer.writerow(row)

            else:
                words_with_similar_annotation = 0
                total_words = 0
                for index in range(len(tag_1)):
                    if tag_1[index]['value'] == tag_2[index]['value']:
                        words_with_similar_annotation += 1
                    total_words += 1

                ann1_tags = [elem['value'] for elem in tag_1]
                ann2_tags = [elem['value'] for elem in tag_2]
                kappa_score = cohen_kappa_score(ann1_tags, ann2_tags, labels=None, weights=None)

                row = [
                    date_1, tag_1, link_1, hashtag_1, time_1, empty,
                    date_2, tag_2, link_2, hashtag_2, time_2, empty,
                    words_with_similar_annotation, total_words, kappa_score
                ]

                if float(str(kappa_score)) >= float(kappa):
                    writer.writerow(row)

            counter -= 1

    return send_file('csv/IAA.csv', as_attachment=True)


@app.route('/submit-matrix-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_mat_sentence():
    matrix_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentence = requestdata.get('sentence')
    mat_id = requestdata.get('mat_id', None)
    selected = requestdata.get('selected')
    username = requestdata.get('username', None)
    date = requestdata.get('date', None)
    timeDifference = requestdata.get('timeDifference', None)
    feedback = requestdata.get('feedback', None)

    new_entry = [selected, sentence, date, timeDifference, feedback]

    user_data = matrix_collection.find_one({'username': username})

    if not user_data:
        return jsonify({'result': 'User Not Found.'})
    for entry in user_data.get('matrixTag', []):
        if (
            entry[2] == date and  
            entry[3] == timeDifference and 
            json.dumps(entry[0], sort_keys=True) == json.dumps(selected, sort_keys=True)  # selected tags match
        ):
            return jsonify({'result': 'Duplicate Entry. Not Stored.'})

    matrix_collection.update_one({'username': username}, {
        '$set': {'mat_id': mat_id},
        '$push': {'matrixTag': new_entry}
    })

    return jsonify({'result': 'Message Stored Successfully'})


@app.route('/submit-pos-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def submit_pos_sentence():
    user_collection = database.get_collection('pos')
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    pos_id = requestdata['pos_id']
    pos_tag = requestdata['pos_tag']
    username = requestdata['username']
    date = requestdata['date']
    timeDifference = requestdata['timeDifference']
    feedback = requestdata.get('feedback', None)

    new_entry = [date, timeDifference, pos_tag, feedback]

    if any(new_entry):
        user_data = user_collection.find_one({'username': username})

        if user_data:
            for entry in user_data.get('posTag', []):
                if (
                    entry[0] == date and
                    entry[1] == timeDifference and
                    json.dumps(entry[2], sort_keys=True) == json.dumps(pos_tag, sort_keys=True)
                ):
                    return jsonify({'result': 'Duplicate Entry. Not Stored.'})

            user_collection.update_one({'username': username}, {
                '$set': {'pos_id': pos_id},
                '$push': {'posTag': new_entry}
            })
            return jsonify({'result': 'Message Stored Successfully'})
        else:
            return jsonify({'result': 'User Not Found.'})


@app.route('/submit-ner-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_ner_sentence():
    ner_collection = database.get_collection('ner')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    ner_id = requestdata.get('ner_id')
    ner_tag = requestdata.get('ner_tag')
    username = requestdata.get('username')
    date = requestdata.get('date', None)
    timeDifference = requestdata.get('timeDifference', None)
    feedback = requestdata.get('feedback', None)

    new_entry = [date, timeDifference, ner_tag, feedback]

    if any(new_entry):
        user_data = ner_collection.find_one({'username': username})

        if user_data:
            for entry in user_data.get('nerTag', []):
                if (
                    entry[0] == date and  
                    entry[1] == timeDifference and  
                    json.dumps(entry[2], sort_keys=True) == json.dumps(ner_tag, sort_keys=True) 
                ):
                    return jsonify({'result': 'Duplicate Entry. Not Stored.'})

            ner_collection.update_one({'username': username}, {
                '$set': {'ner_id': ner_id},
                '$push': {'nerTag': new_entry}
            })
            return jsonify({'result': 'Message Stored Successfully'})
        else:
            return jsonify({'result': 'User Not Found.'})
    else:
        return jsonify({'result': 'No valid data provided.'})

@app.route('/submit-translation', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_trans_sentence():
    translation_collection = database.get_collection('translation')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    trans_id = requestdata.get('trans_id')
    sentence = requestdata.get('sentence')
    eng_tags = requestdata.get('englishTranslation')
    RH_tags = requestdata.get('hindiTranslation')
    DH_tags = requestdata.get('texttrans')
    username = requestdata.get('username')
    date = requestdata.get('date', None)
    timeDifference = requestdata.get('timeDifference', None)
    feedback = requestdata.get('feedback', None)

    lst = [ date, timeDifference, sentence, eng_tags, RH_tags, DH_tags, feedback ]

    translation_collection.update_one(
        {'username': username}, 
        {
            '$set': {'trans_id': trans_id},  
            '$addToSet': {'transTag': lst}  
        },
        upsert=True  
)
    return jsonify({'result': 'Message Stored Successfully'})



@app.route('/get-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def get_edit_sentence():
    user_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    # print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentId = requestdata['id']
    username = requestdata['logged_in_user']

    user = user_collection.find({'username': username})
    user = list(user)
    user = user[0]
    print("Data: ", user)
    userTags = user['sentTag'][sentId-1]

    return jsonify({'result': userTags})

@app.route('/get-mat-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def get_mat_edit_sentence():
    user_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    mat_id = requestdata['id']
    username = requestdata['logged_in_user']

    user = user_collection.find({'username': username})
    user = list(user)
    user = user[0]
    print("Data: ", user)
    userTags = user['matrixTag'][mat_id-1]
            
    return jsonify({'result': userTags})

@app.route('/pos-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def pos_edit_sentence():
    sentences_collection = database["pos"]
    requestdata = json.loads(request.data)
    print("request", requestdata)
    pos_id = requestdata['id']
    username = requestdata['logged_in_user']
    print("pos_id",pos_id)

    result = sentences_collection.find({'username': username})
    data = list(result)

    if data: 
        data = data[0]
        # pos_id = data['pos_id']
        posTag = data['posTag'][pos_id-1]

        result = {
            'pos_id': pos_id,
            'pos_tags': posTag,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})

@app.route('/ner-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def ner_edit_sentence():
    sentences_collection = database["ner"]
    requestdata = json.loads(request.data)
    print("request", requestdata)
    ner_id = requestdata['id']
    username = requestdata['logged_in_user']
    print("ner_id",ner_id)

    result = sentences_collection.find({'username': username})
    data = list(result)

    if data: 
        data = data[0]
        nerTag = data['nerTag'][ner_id-1]

        result = {
            'ner_id': ner_id,
            'ner_tags': nerTag,
            'message': "Sentence Fetched Successfully."
        }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})


@app.route('/trans-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def trans_edit_sentence():
    sentences_collection = database["translation"]
    requestdata = json.loads(request.data)
    print("request", requestdata)
    trans_id = requestdata.get('trans_id')
    username = requestdata['logged_in_user']
    print("trans_id",trans_id)

    result = sentences_collection.find({'username': username})
    data = list(result)

    if data: 
        data = data[0]
        transTag = data['transTag'][trans_id-1]

        result = {
                'trans_id': trans_id,
                'sentence': transTag[2],  
                'eng_tags': transTag[3],  
                'RH_tags': transTag[4],  
                'DH_tags': transTag[5], 
                'message': "Sentence Fetched Successfully."
            }
        return jsonify({'result': result})
    else:
        return jsonify({'error': "No sentence found for the provided sentId"})

@app.route('/submit-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_edit_sentence():
    user_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentId = requestdata['sentId']
    tag = requestdata['tag']
    username = requestdata['username']
    date = requestdata['date']
    hypertext = requestdata.get('hypertext', None)
    hashtags = requestdata.get('hashtags', None)
    timeDifference = requestdata['timeDifference']
    feedback = requestdata.get('feedback', None)

    lst = [date, tag, hypertext, hashtags, timeDifference, feedback]

    print(lst)

    print(sentId, tag, username)

    user = user_collection.find({'username': username})
    user = list(user)
    sentTag = user[0]['sentTag']
    sentTag[sentId - 1] = lst

    user_collection.update_one({'username': username}, {
        '$set': {'sentTag': sentTag}
    })

    return jsonify({'result': 'Message Stored Successfully'})

@app.route('/submit-pos-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_pos_edit_sentence():
    user_collection = database.get_collection('pos')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])
    print(requestdata)

    pos_id = int(requestdata['pos_id']) 
    pos_tag = requestdata['pos_tag']
    username = requestdata['username']
    date = requestdata['date']
    timeDifference = requestdata['timeDifference']
    feedback = requestdata.get('feedback', None)

    lst = [date, timeDifference, pos_tag, feedback]
    print(pos_id, pos_tag, username)
    user = user_collection.find({'username': username})
    user = list(user)
    posTag = user[0]['posTag']
    # posTag[pos_id - 1] = lst
    if 0 <= pos_id - 1 < len(posTag):
        posTag[pos_id - 1] = lst  
    else:
        print("Invalid pos_id")

    user_collection.update_one({'username': username}, {
        '$set': {'posTag': posTag}
    })

    return jsonify({'result': 'Message Stored Successfully'})


@app.route('/submit-ner-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_ner_edit_sentence():
    user_collection = database.get_collection('ner')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])
    print(requestdata)

    ner_id = int(requestdata['ner_id']) 
    ner_tag = requestdata['ner_tag']
    username = requestdata['username']
    date = requestdata['date']
    timeDifference = requestdata['timeDifference']
    feedback = requestdata.get('feedback', None)

    lst = [date, timeDifference, ner_tag, feedback]
    print(ner_id, ner_tag, username)
    user = user_collection.find({'username': username})
    user = list(user)
    nerTag = user[0]['nerTag']
    if 0 <= ner_id - 1 < len(nerTag):
        nerTag[ner_id - 1] = lst  
    else:
        print("Invalid pos_id")

    user_collection.update_one({'username': username}, {
        '$set': {'nerTag': nerTag}
    })

    return jsonify({'result': 'Message Stored Successfully'})

@app.route('/submit-edit-translation', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def submit_edit_translation():
    translation_collection = database.get_collection('translation')

    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    trans_id = int(requestdata.get('trans_id'))  
    sentence = requestdata.get('sentence')
    eng_tags = requestdata.get('englishTranslation')
    RH_tags = requestdata.get('hindiTranslation')
    DH_tags = requestdata.get('texttrans')
    username = requestdata.get('username')
    date = requestdata.get('date', None)
    timeDifference = requestdata.get('timeDifference', None)
    feedback = requestdata.get('feedback', None)

    lst = [date, timeDifference, sentence, eng_tags, RH_tags, DH_tags, feedback]

    user = translation_collection.find_one({'username': username})
    if user:
        transTag = user.get('transTag', [])
        if 0 <= trans_id - 1 < len(transTag):
            transTag[trans_id - 1] = lst  
        else:
            transTag.append(lst)

        translation_collection.update_one(
            {'username': username},
            {'$set': {'transTag': transTag}}
        )
        return jsonify({'result': 'Translation Updated Successfully'})
    else:
        new_user_data = {
            'username': username,
            'transTag': [lst]
        }
        translation_collection.insert_one(new_user_data)
        return jsonify({'result': 'New Translation Created Successfully'})


@app.route('/submit-mat-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_mat_edit_sentence():
    user_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    mat_id = requestdata['mat_id']
    selected = requestdata['selected']
    sentence = requestdata['sentence']
    username = requestdata['username']
    date = requestdata['date']
    timeDifference = requestdata['timeDifference']
    feedback = requestdata.get('feedback', None)

    lst = [selected, sentence, date, timeDifference, feedback]

    print(mat_id, selected, username)

    user = user_collection.find({'username': username})
    user = list(user)
    matTag = user[0]['matrixTag']
    # matTag[mat_id - 1] = lst
    while len(matTag) < mat_id:
        matTag.append([])  

    matTag[mat_id - 1] = lst

    user_collection.update_one({'username': username}, {
        '$set': {'matrixTag': matTag}
    })

    return jsonify({'result': 'Message Stored Successfully'})

@app.route('/all-sentences', methods=['GET', 'POST'])
# @is_logged_in
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_sentence():
    user_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    username = json.loads(requestdata['username'])
    
    if 'start' in requestdata:
        start_value = requestdata.get('start')
        
        if start_value is not None:
            start = int(start_value) - 1
        else:
            start = 0
    else:
        raise ValueError("Missing or invalid 'start' value in requestdata")
    
    end = start + 15
    print('username: ', username)

    result = user_collection.find_one({'username': username})
    if not result:
        return jsonify({'result': [], 'total_count': 0})

    sent_tags = result.get('sentTag', [])
    total_count = len(sent_tags)  # Get total count of all sentence tags

    if end > len(sent_tags):
        end = len(sent_tags)
    
    sent_tags_range = sent_tags[start:end]

    return jsonify({
        'result': sent_tags_range,
        'total_count': total_count  
    })


@app.route('/all-m-sentences', methods=['POST'])
def all_m_sentence():
    matrix_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    username = json.loads(requestdata['username'])
    matrix_result = matrix_collection.find_one({'username': username})
    print("matrix_result:", matrix_result)
    
    if 'start' in requestdata:
        start_value = requestdata.get('start')
        
        if start_value is not None:
            start = int(start_value) - 1
        else:
            start = 0
    else:
        raise ValueError("Missing or invalid 'start' value in requestdata")
    
    end = start + 15
    print('username: ', username)

    matrix_result = matrix_collection.find_one({'username': username})
    if not matrix_result:
        return jsonify({'result': [], 'total_count': 0})

    matrix_tags = matrix_result.get('matrixTag', [])
    total_count = len(matrix_tags)  
    print(matrix_result)
    if end > len(matrix_tags):
        end = len(matrix_tags)
    
    matrix_tags_range = matrix_tags[start:end]

    return jsonify({
        'result': matrix_tags_range,
        'total_count': total_count  
    })

@app.route('/all-pos-sentences', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_pos_sentence():
    user_collection = database.get_collection('pos')
    requestdata = json.loads(request.data)
    print("Request data:", requestdata)
    requestdata = json.loads(requestdata['body'])
    username = json.loads(requestdata['username'])
    start = int(requestdata.get('start', 1)) - 1
    end = start + 15
    print('username: ', username)

    user_data = user_collection.find_one({'username': username})
    if not user_data or 'posTag' not in user_data:
        return jsonify({'result': []}), 404

    pos_tags = user_data['posTag']
    if end > len(pos_tags):
        end = len(pos_tags)
    pos_tags_range = pos_tags[start:end]

    return jsonify({
        'result': pos_tags_range,
        'total_count': len(pos_tags),
        'start': start + 1,
        'end': end
    })


@app.route('/all—t-sentences', methods=['GET', 'POST'])
# @is_logged_in
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_t_sentence():
    translation_collection = database.get_collection('translation')
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])
    print(requestdata)
    username = json.loads(requestdata['username'])
    
    if 'start' in requestdata:
        start_value = requestdata.get('start') 
        if start_value is not None:
            start = int(start_value) - 1
        else:
            start = 0  
    else:
        raise ValueError("Missing or invalid 'start' value in requestdata")
    
    end = start + 15

    result = translation_collection.find_one({'username': username})
    
    if not result:
        return jsonify({'result': [], 'total_count': 0})
    
    trans_tags = result.get('transTag', [])
    total_count = len(trans_tags)  
    
    if end > len(trans_tags):
        end = len(trans_tags)

    trans_tags_range = trans_tags[start:end]

    return jsonify({
        'result': trans_tags_range,
        'total_count': total_count  
    })

@app.route('/all-ner-sentences', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_ner_sentence():
    user_collection = database.get_collection('ner')
    requestdata = json.loads(request.data)
    print("Request data:", requestdata)
    requestdata = json.loads(requestdata['body'])
    username = json.loads(requestdata['username'])
    start = int(requestdata.get('start', 1)) - 1
    end = start + 15
    print('username: ', username)

    user_data = user_collection.find_one({'username': username})
    if not user_data or 'nerTag' not in user_data:
        return jsonify({'result': []}), 404

    ner_tags = user_data['nerTag']
    if end > len(ner_tags):
        end = len(ner_tags)
    ner_tags_range = ner_tags[start:end]

    return jsonify({
        'result': ner_tags_range,
        'total_count': len(ner_tags),
        'start': start + 1,
        'end': end
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
