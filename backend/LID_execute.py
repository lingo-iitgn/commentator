from LID_tool.getLanguage import langIdentify
import sys
import pymongo

#conn_str = "mongodb://localhost:27017"
conn_str = 'mongodb://127.0.0.1:27017';

client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
database = client['annotation_tool']

lid_collection = database.get_collection('lid')


sentences_collection = database.get_collection('sentences')
prev_sent = sentences_collection.find()
prev_sent = list(prev_sent)
total_num_of_sent = len(prev_sent)

last_row_id = 0
print(last_row_id)
prev = lid_collection.find()
prev = list(prev)
if len(prev) > 0:
    prev = prev[-1]
    print(prev['tag_id'])
    last_row_id = prev['tag_id']


sentence_details = prev_sent[last_row_id]
sentence = sentence_details['sentence']
start_index = sentence_details['sid']
print('SENTENCE = ', sentence)
print(total_num_of_sent)
print(prev_sent[start_index-1])

for i in range(start_index-1, total_num_of_sent):
    sentence = prev_sent[i]['sentence']
    lang = langIdentify(sentence, 'classifiers/HiEn.classifier')
    tags = []

    print(lang)
    for elem in lang:
        inter = [elem[0]]
        for i in range(1, len(elem)):
            if elem[i] is '1':
                inter.append(elem[i-1][0])
        if len(inter) == 1:
            inter.append('u')
        tags.append(inter)

    print('LANGUAGE TAG = ', tags)
    lid_collection.insert_one({
        'tags': tags,
        'tag_id': last_row_id + 1
    })
    last_row_id = last_row_id + 1