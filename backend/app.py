import string
import sys
import pymongo
from flask import Flask, jsonify, redirect, render_template, request, json, session, send_from_directory, send_file
from flask_session import Session
import pandas as pd
import csv
from passlib.hash import sha256_crypt
from functools import wraps
import json
from flask_cors import CORS, cross_origin
import os
import subprocess
import numpy as np
from codeswitch.codeswitch import POS
from bson.objectid import ObjectId
from LID_tool.getLanguage import langIdentify
from sklearn.metrics import cohen_kappa_score

app = Flask(__name__)

cors = CORS(app, resources={
            r"/register": {"origins": "*"}}, static_folder='../frontend/build')
app.config.from_pyfile('config.py')
Session(app)

sess = Session()
sess.init_app(app)

frontend = 'http://localhost:3003'

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
    lid_collection = database["lid"] 
    pos_collection = database["pos"]
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


@app.route('/login', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def login():
    user_collection = database.get_collection('users')
    lid_collection = database["lid"]  
    sentences_collection = database["sentences"]
    pos_collection = database["pos"]
    matrix_collection = database["matrix"]
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

    # Find latest document for sentId, pos_id, and mat_id
    lid_result = lid_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    pos_result = pos_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])
    mat_result = matrix_collection.find_one({'user_id': session['user_id']}, sort=[('_id', -1)])

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
    returning = {
        'username': session['username'],
        'admin': admin,
        'sentId': sentId,
        'pos_id': pos_id,
        'mat_id' : mat_id,
    }

    return jsonify({'success': returning, 'username': session['username'], 'sentId': sentId, 'pos_id': pos_id, 'mat_id': mat_id})

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
    pos_id = requestdata['pos_id']
    print("pos_id",pos_id)

    result = sentences_collection.find({'pos_id': pos_id})
    data = list(result)

    if data: 
        data = data[0]
        sentence = data['sentence']
        pos_id = data['pos_id']
        pos_tags = data['pos_tags']

        result = {
            'sentence': sentence,
            'pos_id': pos_id,
            'pos_tags': pos_tags,
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
    print("request", requestdata)
    mat_id = requestdata['mat_id']
    print("mat_id",mat_id)

    result = sentences_collection.find({'mat_id': mat_id})
    data = list(result)

    if data: 
        data = data[0]
        sentence = data['sentence']
        mat_id = data['mat_id']
        tags = data['tags']


        result = {
            'sentence': sentence,
            'mat_id': mat_id,
            'tags': tags,
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
# @app.route('/admin-pos-file-upload', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def admin_file_upload():
    import pandas as pd
    from codeswitch.codeswitch import POS
    from LID_tool.getLanguage import langIdentify

    print(request.files['file'])
    file = request.files['file']
    file.save('uploads/{}'.format(file.filename))

    sentences_collection = database.get_collection('sentences')
    pos_collection = database.get_collection('sentences')
    matrix_collection = database.get_collection('sentences')

    filename = file.filename
    df = pd.read_csv('uploads/{}'.format(filename), header=None)
    df = df.iloc[:, 0]
    print(df)

    last_sent_id = 0
    prev_sent = sentences_collection.find()
    prev_sent = list(prev_sent)
    if len(prev_sent) > 0:
        prev_sent = prev_sent[-1]
        print(prev_sent['sentId'])
        last_sent_id = prev_sent['sentId']

    last_pos_id = 0
    prev_pos = pos_collection.find()
    prev_pos = list(prev_pos)
    if len(prev_pos) > 0:
        prev_pos = prev_pos[-1]
        print(prev_pos['pos_id'])
        last_pos_id = prev_pos['pos_id']

    last_mat_id = 0
    prev_mat = matrix_collection.find()
    prev_mat = list(prev_mat)
    if len(prev_mat) > 0:
        prev_mat = prev_mat[-1]
        print(prev_mat['mat_id'])
        last_mat_id = prev_mat['mat_id']

    idx = 0
    text = []
    for sent in range(len(df)):
        text.append(df[sent])

    print(text)

    pos = POS('hin-eng')
    pos_tags = pos.tag(text)
    print(pos_tags)

    for sent in range(len(df)):
        last_sent_id += 1
        last_pos_id += 1
        last_mat_id += 1

        print(df[sent])
        sentence = df[sent]
        pos_id = 'pos' + str(last_pos_id).zfill(5)  # Format pos_id as posXXXXX
        pos_collection.insert_one({
            "sentence": sentence,
            "sentId": last_sent_id,
            "pos_id": last_pos_id,
            "mat_id" : last_mat_id,
            "tags": [],
            "pos_tags": json.dumps(pos_tags[idx], cls=NpEncoder),
        })

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

        pos_collection.update_one({'sentence': sentence}, {'$set': {'tags': tags}})

        idx = idx + 1

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

@app.route('/fetch-pos-sent', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_pos_sent():
    pos_collection = database.get_collection('sentences')
    pos_list = pos_collection.find({})
    pos_list = list(pos_list)
    #print(pos_list)

    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    pos_id = requestdata['pos_id']

    pos_list_gen = []
    for pos in pos_list:
        if(pos['pos_id'] == int(pos_id) + 1):
            pos_list_gen.append([pos['sentence'], pos['pos_tags']])
            break

    return jsonify({'result': pos_list_gen})

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

    print('Schemas Created')
    return redirect('{}/admin'.format(frontend))


@app.route('/fetch-users-list', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def fetch_users_list():
    user_collection = database.get_collection('users')
    user_list = user_collection.find({})
    user_list = list(user_list)

    users_list = []
    for user in user_list:
        users_list.append(user['username'])
    print(users_list)
    # user_list = list(user_collection)
    # print(user_list)

    return jsonify({'result': users_list})


@app.route('/csv-download', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def csv_download():
    username = request.form.get('username')
    cmi = request.form.get('cmi')
    file_type = request.form.get('file_type')
    pos_file = None
    lid_file = None
    matrix_file = None

    if username and username != 'ALL':
        pos_collection = database.get_collection('pos')
        lid_collection = database.get_collection('lid')
        matrix_collection = database.get_collection('matrix')

        # Process POS collection
        user = pos_collection.find_one({'username': username})
        if user:
            posTag = user.get('posTag', [])
            pos_file = f'csv/{username}_pos.csv'
            with open(pos_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['date', 'time', 'tag'])
                for sentence in posTag:
                    date = sentence[0]
                    time = sentence[1]
                    tags = sentence[2]
                    feedback = sentence[3]
                    row = [date, time, tags, feedback]
                    writer.writerow(row)

        # Process LID collection
        user = lid_collection.find_one({'username': username})
        if user:
            sentTag = user.get('sentTag', [])
            lid_file = f'csv/{username}_lid.csv'
            with open(lid_file, 'w', encoding='utf-8', newline="") as f:
                writer = csv.writer(f)
                writer.writerow(['grammar', 'date', 'tag', 'link', 'hashtag', 'time', 'CMI Score'])
                for sentence in sentTag:
                    grammar = sentence[0]
                    date = sentence[1]
                    tag = sentence[2]
                    link = sentence[3]
                    hashtag = sentence[4] if sentence[4] else []
                    time = sentence[5]
                    feedback = sentence[6]
                    row = [grammar, date, tag, link, hashtag, time, feedback]

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

        # Process Matrix collection
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

        if file_type == 'pos' and pos_file:
            return send_file(pos_file, as_attachment=True)
        elif file_type == 'lid' and lid_file:
            return send_file(lid_file, as_attachment=True)
        elif file_type == 'matrix' and matrix_file:
            return send_file(matrix_file, as_attachment=True)
        else:
            return "File not found", 404

    elif username == 'ALL':
        pos_collection = database.get_collection('pos')
        lid_collection = database.get_collection('lid')
        matrix_collection = database.get_collection('matrix')

        # Process all users in POS collection
        all_users_pos = pos_collection.find()
        pos_file = 'csv/all_pos.csv'
        with open(pos_file, 'w', encoding='utf-8', newline="") as f:
            writer = csv.writer(f)
            writer.writerow(['username', 'date', 'time', 'tag', 'feedback'])
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
            writer.writerow(['username', 'date', 'tag', 'link', 'hashtag', 'time', 'feedback', 'CMI Score'])
            for user in all_users_lid:
                username = user['username']
                sentTag = user.get('sentTag', [])
                for sentence in sentTag:
                    date = sentence[1]
                    tag = sentence[2]
                    link = sentence[3]
                    hashtag = sentence[4] if sentence[4] else []
                    time = sentence[5]
                    feedback = sentence[6]
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
            writer.writerow(['username', 'tags', 'date', 'time'])
            for user in all_users_matrix:
                username = user['username']
                matrix_data = user.get('matrixTag', [])
                for sentence in matrix_data:
                    tags = sentence[0]
                    date = sentence[1]
                    time = sentence[2]
                    row = [username, tags, date, time]
                    writer.writerow(row)

        # Return the requested file
        if file_type == 'pos':
            return send_file(pos_file, as_attachment=True)
        elif file_type == 'lid':
            return send_file(lid_file, as_attachment=True)
        elif file_type == 'matrix':
            return send_file(matrix_file, as_attachment=True)
        else:
            return "File not found", 404

    return "Invalid request", 400
    
@app.route('/compare-annotators', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def compare_annotators():
    from flask import send_file

    username1 = request.form.get('username1')
    username2 = request.form.get('username2')
    kappa = request.form.get('kappa')
    print(username1, username2, kappa)

    # return jsonify({'result': 'true'})
    # os.system('compare.py {} {}'.format(username1, username2))
    import csv
    username1_name = username1
    username2_name = username2
    print('username1 = ', username1_name)
    print('username2 = ', username2_name)

    user_collection = database.get_collection('lid')
    username1 = user_collection.find({'username': username1_name})
    username2 = user_collection.find({'username': username2_name})

    user1 = list(username1)
    user2 = list(username2)

    print('USER 1 = ', user1)
    print('USER 2 = ', user2)

    counter = min(int(user1[0]['sentId']), int(user2[0]['sentId']))
    print(counter)

    sentTag1 = user1[0]['sentTag']
    sentTag2 = user2[0]['sentTag']

    with open('csv/compare.csv', 'w', encoding='utf-8', newline="") as f:
        writer = csv.writer(f)

        writer.writerow(['grammar_{}'.format(username1_name), 'date_{}'.format(username1_name), 'tag_{}'.format(username1_name), 'link_{}'.format(username1_name), 'hashtag_{}'.format(username1_name), 'time_{}'.format(username1_name), '', 'grammar_{}'.format(username2_name), 'date_{}'.format(username2_name), 'tag_{}'.format(username2_name), 'link_{}'.format(username2_name), 'hashtag_{}'.format(username2_name),
                        'time_{}'.format(username2_name), '', 'grammer_same', 'words_with_similar_annotation', 'total_words', 'Cohen Kappa Score'])

        for count in reversed(range(counter)):
            # print(sentence)
            grammar_1 = sentTag1[count][0]
            date_1 = sentTag1[count][1]
            tag_1 = sentTag1[count][2]
            link_1 = sentTag1[count][3]
            hashtag_1 = sentTag1[count][4] if sentTag1[count][4] else []
            time_1 = sentTag1[count][5]

            empty = ''

            grammar_2 = sentTag2[count][0]
            date_2 = sentTag2[count][1]
            tag_2 = sentTag2[count][2]
            link_2 = sentTag2[count][3]
            hashtag_2 = sentTag2[count][4] if sentTag2[count][4] else []
            time_2 = sentTag2[count][5]

            grammer_same = 0
            if grammar_1 == grammar_2:
                grammer_same = 1

            words_with_similar_annotation = 0
            total_words = 0
            for index in range(len(tag_1)):
                if tag_1[index]['value'] == tag_2[index]['value']:
                    words_with_similar_annotation += 1
                total_words += 1

            from sklearn.metrics import cohen_kappa_score
            ann1_tags = [elem['value'] for elem in tag_1]
            ann2_tags = [elem['value'] for elem in tag_2]
            kappa_score = cohen_kappa_score(
                ann1_tags, ann2_tags, labels=None, weights=None)

            row = [grammar_1, date_1, tag_1, link_1, hashtag_1, time_1,
                   empty, grammar_2, date_2, tag_2, link_2, hashtag_2, time_2, empty, grammer_same, words_with_similar_annotation, total_words, kappa_score]

            print(kappa_score, type(kappa_score))
            if(float(str(kappa_score)) >= float(kappa)):
                writer.writerow(row)
            counter -= 1
            # break

    return send_file('csv/compare.csv', as_attachment=True)


@app.route('/submit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_sentence():
    lid_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentId = requestdata.get('sentId', None)
    selected = requestdata.get('selected', None)
    tag = requestdata.get('tag', None)
    username = requestdata.get('username', None)
    date = requestdata.get('date', None)
    hypertext = requestdata.get('hypertext', None)
    hashtags = requestdata.get('hashtags', None)
    timeDifference = requestdata.get('timeDifference', None)

    lst = [selected, date, tag, hypertext, hashtags, timeDifference]

    lid_collection.update_one({'username': username}, {
         '$set': {'sentId': sentId},
            '$push': {'sentTag': lst}
    })
    return jsonify({'result': 'Message Stored Successfully'})

@app.route('/submit-matrix-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_mat_sentence():
    lid_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    mat_id = requestdata.get('mat_id', None)
    selected = requestdata.get('selected')
    username = requestdata.get('username', None)
    date = requestdata.get('date', None)
    timeDifference = requestdata.get('timeDifference', None)

    lst = [selected, date, timeDifference]
    # print("list", lst)

    lid_collection.update_one({'username': username}, {
         '$set': {'mat_id': mat_id},
            '$push': {'matrixTag': lst}
    })
    return jsonify({'result': 'Message Stored Successfully'})

@app.route('/submit-pos-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
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

    lst = [date, timeDifference, pos_tag, feedback]
   # print(lst)

    user_collection.update_one({'username': username}, {
        '$set': {'pos_id': pos_id},
        '$push': {'posTag': lst}
    })

    return jsonify({'result': 'Message Stored Successfully'})

# @app.route('/tokenize-en', methods=['POST'])
# # @is_logged_in
# def tokenize_en():
#     sentences_collection = database.get_collection('sentences')
#     requestdata = json.loads(request.data)
#     print(requestdata)
#     requestdata = json.loads(requestdata['body'])

#     sentId = requestdata['id']
#     print(sentId)
#     result = sentences_collection.find({'sid': sentId})
#     data = list(result)
#     data = data[0]
#     sentence = data['sentence']
#     print(sentence)

#     return jsonify({'result': 'Message Stored Successfully'})

@app.route('/get-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def get_edit_sentence():
    user_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
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
    # print("pos_id",pos_id)

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

@app.route('/submit-edit-sentence', methods=['GET', 'POST'])
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
# @is_logged_in
def submit_edit_sentence():
    user_collection = database.get_collection('lid')
    requestdata = json.loads(request.data)
    print(requestdata)
    requestdata = json.loads(requestdata['body'])

    sentId = requestdata['sentId']
    selected = requestdata['selected']
    tag = requestdata['tag']
    username = requestdata['username']
    date = requestdata['date']
    hypertext = requestdata.get('hypertext', None)
    hashtags = requestdata.get('hashtags', None)
    timeDifference = requestdata['timeDifference']

    lst = [selected, date, tag, hypertext, hashtags, timeDifference]

    #print(lst)

    print(sentId, selected, tag, username)

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

    lst = [date, timeDifference, pos_tag]
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
    username = requestdata['username']
    date = requestdata['date']
    timeDifference = requestdata['timeDifference']

    lst = [selected, date, timeDifference]

    #print(lst)

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
    start = int(requestdata['start']-1)
    end = start + 15
    print('username: ', username)
    
    result = user_collection.find_one({'username': username})
    if not result:
        return jsonify({'error': 'User not found'}), 404

    sent_tags = result.get('sentTag', [])
    print(sent_tags)
    if end > len(sent_tags):
        end = len(sent_tags)
    sent_tags_range = sent_tags[start:end]

    return jsonify({'result': sent_tags_range})


@app.route('/all-m-sentences', methods=['GET', 'POST'])
# @is_logged_in
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_m_sentence():
    user_collection = database.get_collection('lid')
    matrix_collection = database.get_collection('matrix')
    requestdata = json.loads(request.data)
    requestdata = json.loads(requestdata['body'])

    username = json.loads(requestdata['username'])
    start = int(requestdata['start'] - 1)
    end = start + 15

    result = user_collection.find_one({'username': username})
    sent_tags = result.get('sentTag', [])

    matrix_result = matrix_collection.find_one({'username': username})
    if not matrix_result:
        return jsonify({'error': 'Matrix tags not found'}), 404

    matrix_tags = matrix_result.get('matrixTag', [])
    
    if end > len(matrix_tags):
        end = len(matrix_tags)
    
    sent_tags_range = sent_tags[start:end]

    return jsonify({'result': sent_tags_range})


@app.route('/all-pos-sentences', methods=['GET', 'POST'])
# @is_logged_in
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def all_pos_sentence():
    user_collection = database.get_collection('pos')
    requestdata = json.loads(request.data)
    print("Request data:", requestdata)
    requestdata = json.loads(requestdata['body'])
    username = json.loads(requestdata['username'])
    start = int(requestdata['start']-1)
    end = start + 15
    print('username: ', username)

    result = user_collection.find_one({'username': username})
    
    if not result or 'posTag' not in result:
        return jsonify({'result': []}), 404
    
    pos_tags = result['posTag']
    
    if end > len(pos_tags):
        end = len(pos_tags)
    pos_tags_range = pos_tags[start:end]

    return jsonify({'result': pos_tags_range})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

