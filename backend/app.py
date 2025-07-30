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
    kappa_type = request.form.get('kappa_type', 'cohen').lower()
    task_type = request.form.get('task_type', 'lid').lower()

    if not username1 or not username2 or not kappa:
        return "Missing required form parameters (username1, username2, kappa)", 400
    if kappa_type == 'fleiss' and not username3:
        return "Fleiss' Kappa requires 3 annotators", 400
    try:
        kappa_threshold = float(kappa)
    except ValueError:
        return "Invalid kappa threshold; must be a number", 400

    task_collection_mapping = {
        'lid': 'lid',
        'ner': 'ner', 
        'pos': 'pos',
        'matrix': 'matrix'
    }
    collection_name = task_collection_mapping.get(task_type)
    user_collection = database.get_collection(collection_name)

    sentence_format = {
        'lid': {'date': 0, 'tags': 1, 'link': 2, 'hashtag': 3, 'time': 4},
        'ner': {'date': 0, 'time': 1, 'tags': 2},
        'pos': {'date': 0, 'time': 1, 'tags': 2},
        'matrix': {'tags': 0, 'sentence': 1, 'date': 2, 'time': 3, 'feedback': 4}
    }
    format_map = sentence_format.get(task_type)
    if not format_map:
        return f"Unsupported task_type '{task_type}' in sentence format", 400

    tag_field_map = {
        'lid': 'sentTag',
        'ner': 'nerTag',
        'pos': 'posTag',
        'matrix': 'matrixTag'
    }
    tag_field = tag_field_map.get(task_type)
    if not tag_field:
        return f"Tag field mapping not found for task '{task_type}'", 400

    user1_doc = user_collection.find_one({'username': username1})
    user2_doc = user_collection.find_one({'username': username2})
    if not user1_doc:
        return f"No data found for user '{username1}' in collection '{collection_name}'", 404
    if not user2_doc:
        return f"No data found for user '{username2}' in collection '{collection_name}'", 404
    user3_doc = user_collection.find_one({'username': username3}) if username3 else None
    if username3 and not user3_doc:
        return f"No data found for user '{username3}' in collection '{collection_name}'", 404

    for doc, uname in [(user1_doc, username1), (user2_doc, username2)] + ([(user3_doc, username3)] if user3_doc else []):
        if tag_field not in doc:
            return f"User '{uname}' document missing '{tag_field}' field", 400
        if not isinstance(doc[tag_field], list):
            return f"User '{uname}' '{tag_field}' field is not a list", 400
        if len(doc[tag_field]) == 0:
            return f"User '{uname}' '{tag_field}' field list is empty", 400

    sent1 = user1_doc[tag_field]
    sent2 = user2_doc[tag_field]
    sent3 = user3_doc[tag_field] if user3_doc else None
    counter = min(len(sent1), len(sent2), len(sent3) if sent3 else len(sent1))

    if task_type == 'matrix':
        filename = f'csv/IAA_MATRIX_{kappa_type}.csv'
        os.makedirs('csv', exist_ok=True)
        
        def calculate_fleiss_kappa_per_sentence(a1, a2, a3):
            """Calculate Fleiss' Kappa for a single sentence with 3 annotators"""
            try:
                if fleiss_kappa is None:
                    if a1 == a2 == a3:
                        return 1.0
                    elif a1 == a2 or a1 == a3 or a2 == a3:
                        return 0.5
                    else:
                        return 0.0
                
                labels = [a1, a2, a3]
                
                h_count = labels.count('h')
                e_count = labels.count('e')
                
                ratings_matrix = np.array([[h_count, e_count]], dtype=int)
                
                total_ratings = h_count + e_count
                if total_ratings != 3: 
                    return 0.0

                if h_count == 3 or e_count == 3:
                    return 1.0
                
                if h_count == 2 or e_count == 2:
                    return 0.5
                
                kappa_score = fleiss_kappa(ratings_matrix, method='fleiss')
                return kappa_score if not np.isnan(kappa_score) else 0.0
                
            except Exception as e:
                print(f"Error in Fleiss calculation: {e}")
                if a1 == a2 == a3:
                    return 1.0
                elif a1 == a2 or a1 == a3 or a2 == a3:
                    return 0.5
                else:
                    return 0.0
        filename = f'csv/IAA_MATRIX_{kappa_type}.csv'
        os.makedirs('csv', exist_ok=True)
            
        def create_sentence_dict(sent_data, username):
            sentence_dict = {}
            for i, entry in enumerate(sent_data):
                print(f"Processing entry {i} for {username}: {entry}")
                if len(entry) >= 2:  
                    label = entry[0]
                    sentence = entry[1]
                    sentence_dict[sentence] = entry
                    print(f"  Added to dict: sentence='{sentence[:50]}...', label='{label}'")
            return sentence_dict
        
        dict1 = create_sentence_dict(sent1, username1)
        dict2 = create_sentence_dict(sent2, username2)
        dict3 = create_sentence_dict(sent3, username3) if sent3 else None
        
        common_sentences = set(dict1.keys()) & set(dict2.keys())
        if dict3:
            common_sentences &= set(dict3.keys())
        
        print(f"Found {len(common_sentences)} common sentences between users")
        print(f"User data lengths - {username1}: {len(dict1)}, {username2}: {len(dict2)}")
        if dict3:
            print(f"{username3}: {len(dict3)}")
        
        with open(filename, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.writer(csvfile)
            
            if kappa_type == 'fleiss':
                header = [
                    f'sentence_{username1}', f'date_{username1}', f'time_{username1}', f'label_{username1}',
                    f'sentence_{username2}', f'date_{username2}', f'time_{username2}', f'label_{username2}',
                    f'sentence_{username3}', f'date_{username3}', f'time_{username3}', f'label_{username3}',
                    'words_with_similar_annotation_all', 'total_sentences', f'Fleiss_Kappa_MATRIX'
                ]
                writer.writerow(header)
                
                rows_written = 0
                for sentence_text in common_sentences:
                    try:
                        entry1 = dict1[sentence_text]
                        entry2 = dict2[sentence_text]
                        entry3 = dict3[sentence_text]
                        
                        print(f"Processing sentence: '{sentence_text[:50]}...'")
                        print(f"  Entry1: {entry1}")
                        print(f"  Entry2: {entry2}")
                        print(f"  Entry3: {entry3}")
                        
                        a1 = entry1[0] if len(entry1) > 0 else None
                        a2 = entry2[0] if len(entry2) > 0 else None
                        a3 = entry3[0] if len(entry3) > 0 else None
                        
                        date1 = entry1[2] if len(entry1) > 2 else ''
                        time1 = entry1[3] if len(entry1) > 3 else ''
                        date2 = entry2[2] if len(entry2) > 2 else ''
                        time2 = entry2[3] if len(entry2) > 3 else ''
                        date3 = entry3[2] if len(entry3) > 2 else ''
                        time3 = entry3[3] if len(entry3) > 3 else ''
                        
                        print(f"  Extracted labels: a1={a1}, a2={a2}, a3={a3}")
                        
                        if a1 not in ['h', 'e'] or a2 not in ['h', 'e'] or a3 not in ['h', 'e']:
                            print(f"  Skipping due to invalid annotations")
                            continue
                        
                        try:
                            fleiss_score = calculate_fleiss_kappa_per_sentence(a1, a2, a3)
                            if np.isnan(fleiss_score) or fleiss_score is None:
                                if a1 == a2 == a3:
                                    fleiss_score = 1.0  
                                else:
                                    fleiss_score = 0.0  
                            print(f"  Calculated Fleiss Kappa: {fleiss_score}")
                        except Exception as e:
                            print(f"  Error calculating Fleiss kappa: {e}")
                            if a1 == a2 == a3:
                                fleiss_score = 1.0
                            elif a1 == a2 or a1 == a3 or a2 == a3:
                                fleiss_score = 0.5  
                            else:
                                fleiss_score = 0.0 
                        
                        identical = 1 if (a1 == a2 == a3) else 0
                        
                        row = [
                            sentence_text, date1, time1, a1,
                            sentence_text, date2, time2, a2, 
                            sentence_text, date3, time3, a3,
                            identical, 1, fleiss_score
                        ]
                        
                        writer.writerow(row)
                        rows_written += 1
                        print(f"  Written row {rows_written}: Fleiss Kappa = {fleiss_score:.4f}")
                        
                        if fleiss_score < kappa_threshold:
                            print(f"    (Below threshold {kappa_threshold}, but still included)")
                        
                    except Exception as e:
                        print(f"Error processing sentence '{sentence_text[:50]}...': {e}")
                        continue
                
                print(f"Total rows written for Fleiss: {rows_written}")
            
            else: 
                header = [
                    f'sentence_{username1}', f'date_{username1}', f'time_{username1}', f'label_{username1}',
                    f'sentence_{username2}', f'date_{username2}', f'time_{username2}', f'label_{username2}',
                    'words_with_similar_annotation', 'total_sentences', f'Cohen_Kappa_Score_MATRIX'
                ]
                writer.writerow(header)
                
                rows_written = 0
                for sentence_text in common_sentences:
                    try:
                        entry1 = dict1[sentence_text]
                        entry2 = dict2[sentence_text]
                        
                        print(f"Processing sentence: '{sentence_text[:50]}...'")
                        print(f"  Entry1: {entry1}")
                        print(f"  Entry2: {entry2}")
                        
                        a1 = entry1[0] if len(entry1) > 0 else None
                        a2 = entry2[0] if len(entry2) > 0 else None
                        
                        date1 = entry1[2] if len(entry1) > 2 else ''
                        time1 = entry1[3] if len(entry1) > 3 else ''
                        date2 = entry2[2] if len(entry2) > 2 else ''
                        time2 = entry2[3] if len(entry2) > 3 else ''
                        
                        print(f"  Extracted labels: a1={a1}, a2={a2}")
                        print(f"  Dates: date1={date1}, date2={date2}")
                        print(f"  Times: time1={time1}, time2={time2}")
                        
                        if a1 not in ['h', 'e'] or a2 not in ['h', 'e']:
                            print(f"  Skipping due to invalid annotations")
                            continue
                        
                        try:
                            kappa_score = cohen_kappa_score([a1], [a2])
                            if np.isnan(kappa_score):
                                kappa_score = 1.0 if a1 == a2 else 0.0
                        except Exception as e:
                            print(f"  Error calculating Cohen's kappa: {e}")
                            if a1 == a2:
                                kappa_score = 1.0
                            else:
                                kappa_score = 0.0
                        
                        identical = 1 if a1 == a2 else 0
                        
                        row = [
                            sentence_text, date1, time1, a1,
                            sentence_text, date2, time2, a2,
                            identical, 1, kappa_score
                        ]
                        
                        writer.writerow(row)
                        rows_written += 1
                        print(f"  Written row {rows_written}: Cohen Kappa = {kappa_score:.4f}")
                        
                        if kappa_score < kappa_threshold:
                            print(f"    (Below threshold {kappa_threshold}, but still included)")
                            
                    except Exception as e:
                        print(f"Error processing sentence '{sentence_text[:50]}...': {e}")
                        continue
                
                print(f"Total rows written for Cohen: {rows_written}")

        return send_file(filename, as_attachment=True)

    def extract_labels(tag_data, task):
        if not tag_data:
            return []
        elif task in ['ner', 'pos']:
            if isinstance(tag_data, str):
                try:
                    tag_data = json.loads(tag_data)
                except:
                    return []
            labels = []
            if isinstance(tag_data, list) and tag_data:
                for item in tag_data:
                    if isinstance(item, dict) and 'entity' in item:
                        labels.append(item['entity'])
                    elif isinstance(item, dict) and 'word' in item:
                        labels.append(item.get('entity', 'X'))
            return labels
        else:  # lid and others
            if isinstance(tag_data, list) and tag_data and isinstance(tag_data[0], dict):
                return [item.get('value', '') for item in tag_data if item.get('value', '')]
            elif isinstance(tag_data, list):
                return [item for item in tag_data if item]
            return []

    def calculate_kappa_score(ann1, ann2, task_type):
        if not ann1 or not ann2:
            return 0.0
        min_len = min(len(ann1), len(ann2))
        if min_len == 0:
            return 0.0
        ann1_trunc = ann1[:min_len]
        ann2_trunc = ann2[:min_len]
        all_labels = list(set(ann1_trunc + ann2_trunc))
        if len(all_labels) <= 1:
            return 1.0 if ann1_trunc == ann2_trunc else 0.0
        return cohen_kappa_score(ann1_trunc, ann2_trunc, labels=all_labels)

    def calculate_structured_fleiss_kappa(ann1, ann2, ann3):
        n = min(len(ann1), len(ann2), len(ann3))
        if n == 0:
            return 0.0
        ann1, ann2, ann3 = ann1[:n], ann2[:n], ann3[:n]
        categories = sorted(list(set(ann1 + ann2 + ann3)))
        if len(categories) <= 1:
            return 1.0
        matrix = np.zeros((n, len(categories)), dtype=int)
        cat2idx = {cat: idx for idx, cat in enumerate(categories)}
        for i in range(n):
            for ann in [ann1[i], ann2[i], ann3[i]]:
                if ann in cat2idx:
                    matrix[i, cat2idx[ann]] += 1
        return fleiss_kappa(matrix)

    def prepare_fleiss_data(ann1, ann2, ann3):
        n = min(len(ann1), len(ann2), len(ann3))
        if n == 0:
            return np.array([[]])
        ann1, ann2, ann3 = ann1[:n], ann2[:n], ann3[:n]
        categories = sorted(list(set(ann1 + ann2 + ann3)))
        matrix = np.zeros((n, len(categories)), dtype=int)
        cat2idx = {cat: idx for idx, cat in enumerate(categories)}
        for i in range(n):
            for ann in [ann1[i], ann2[i], ann3[i]]:
                if ann in cat2idx:
                    matrix[i, cat2idx[ann]] += 1
        return matrix

    def get_sentence_field(sent_list, idx, field_name):
        if idx >= len(sent_list) or format_map.get(field_name) is None:
            return None
        sentence = sent_list[idx]
        index = format_map.get(field_name)
        return sentence[index] if index < len(sentence) else None

    def generate_headers(u1, u2, u3=None):
        base_fields = ['date', 'tag', 'link', 'hashtag', 'time']
        headers = []
        for user in [u1, u2] + ([u3] if u3 else []):
            for field in base_fields:
                if field in format_map:
                    headers.append(f"{field}_{user}")
            headers.append('')  # Separator
        if kappa_type == 'fleiss' and u3:
            headers.extend(['words_with_similar_annotation_all', 'total_words', f'Fleiss_Kappa_{task_type.upper()}'])
        elif u3:
            headers.extend([
                'words_with_similar_annotation_12', 'words_with_similar_annotation_13', 'words_with_similar_annotation_23',
                'total_words', 'Cohen_Kappa_12', 'Cohen_Kappa_13', 'Cohen_Kappa_23', f'Avg_Cohen_Kappa_{task_type.upper()}'
            ])
        else:
            headers.extend(['words_with_similar_annotation', 'total_words', f'Cohen_Kappa_Score_{task_type.upper()}'])
        return headers

    # Continue with existing logic for other tasks...
    headers = generate_headers(username1, username2, username3)
    os.makedirs('csv', exist_ok=True)
    filename = f'csv/IAA_{task_type.upper()}_{kappa_type}.csv'

    if task_type != 'matrix':
        with open(filename, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(headers)

            for i in reversed(range(counter)):
                try:
                    date_1 = get_sentence_field(sent1, i, 'date') or ''
                    time_1 = get_sentence_field(sent1, i, 'time') or ''
                    link_1 = get_sentence_field(sent1, i, 'link') or ''
                    hashtag_1 = get_sentence_field(sent1, i, 'hashtag') or []
                    tag_1 = get_sentence_field(sent1, i, 'tags') or []

                    date_2 = get_sentence_field(sent2, i, 'date') or ''
                    time_2 = get_sentence_field(sent2, i, 'time') or ''
                    link_2 = get_sentence_field(sent2, i, 'link') or ''
                    hashtag_2 = get_sentence_field(sent2, i, 'hashtag') or []
                    tag_2 = get_sentence_field(sent2, i, 'tags') or []

                    empty = ''

                    ann1 = extract_labels(tag_1, task_type)
                    ann2 = extract_labels(tag_2, task_type)
                    if not ann1 or not ann2:
                        continue

                    if username3:
                        date_3 = get_sentence_field(sent3, i, 'date') or ''
                        time_3 = get_sentence_field(sent3, i, 'time') or ''
                        link_3 = get_sentence_field(sent3, i, 'link') or ''
                        hashtag_3 = get_sentence_field(sent3, i, 'hashtag') or []
                        tag_3 = get_sentence_field(sent3, i, 'tags') or []
                        ann3 = extract_labels(tag_3, task_type)
                        if not ann3:
                            continue

                        total_words = max(len(ann1), len(ann2), len(ann3))
                        min_len = min(len(ann1), len(ann2), len(ann3))

                        if kappa_type == 'fleiss':
                            words_sim_all = sum(1 for x in range(min_len) if ann1[x] == ann2[x] == ann3[x])
                            kappa_score = calculate_structured_fleiss_kappa(ann1, ann2, ann3)
                            row = [
                                date_1, tag_1, link_1, hashtag_1, time_1, empty,
                                date_2, tag_2, link_2, hashtag_2, time_2, empty,
                                date_3, tag_3, link_3, hashtag_3, time_3, empty,
                                words_sim_all, total_words, kappa_score
                            ]
                            if kappa_score >= kappa_threshold:
                                writer.writerow(row)
                        else:
                            words_12 = sum(1 for x in range(min_len) if ann1[x] == ann2[x])
                            words_13 = sum(1 for x in range(min_len) if ann1[x] == ann3[x])
                            words_23 = sum(1 for x in range(min_len) if ann2[x] == ann3[x])
                            kappa_12 = calculate_kappa_score(ann1, ann2, task_type)
                            kappa_13 = calculate_kappa_score(ann1, ann3, task_type)
                            kappa_23 = calculate_kappa_score(ann2, ann3, task_type)
                            avg_kappa = np.mean([kappa_12, kappa_13, kappa_23])

                            row = [
                                date_1, tag_1, link_1, hashtag_1, time_1, empty,
                                date_2, tag_2, link_2, hashtag_2, time_2, empty,
                                date_3, tag_3, link_3, hashtag_3, time_3, empty,
                                words_12, words_13, words_23, total_words, kappa_12, kappa_13, kappa_23, avg_kappa
                            ]
                            if avg_kappa >= kappa_threshold:
                                writer.writerow(row)
                    else:
                        min_len = min(len(ann1), len(ann2))
                        total_words = max(len(ann1), len(ann2))
                        words_sim = sum(1 for x in range(min_len) if ann1[x] == ann2[x])
                        kappa_score = calculate_kappa_score(ann1, ann2, task_type)

                        row = [
                            date_1, tag_1, link_1, hashtag_1, time_1, empty,
                            date_2, tag_2, link_2, hashtag_2, time_2, empty,
                            words_sim, total_words, kappa_score
                        ]
                        if kappa_score >= kappa_threshold:
                            writer.writerow(row)

                except Exception as e:
                    print(f"Error processing sentence index {i}: {e}")
                    continue

        if not os.path.exists(filename):
            return "No data written to CSV; check kappa threshold or data alignment", 404
        return send_file(filename, as_attachment=True)

    return f"Unsupported task_type '{task_type}'", 400

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
