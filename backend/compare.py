import csv
import pymongo
import sys

#conn_str = "mongodb://localhost:27017"

conn_str = 'mongodb://127.0.0.1:27017';

client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
database = client['database_Code_Mixing_from_compass']

print(database.list_collection_names())

users_collection = database.get_collection('users')

username1_name = sys.argv[1]
username2_name = sys.argv[2]
print('username1 = ', username1_name)
print('username2 = ', username2_name)

user_collection = database.get_collection('users')
username1 = user_collection.find({'username': username1_name})
username2 = user_collection.find({'username': username2_name})

user1 = list(username1)
user2 = list(username2)

print('USER 1 = ', user1)
print('USER 2 = ', user2)

counter = min(user1[0]['sentId'], user2[0]['sentId'])
print(counter)

sentTag1 = user1[0]['sentTag']
sentTag2 = user2[0]['sentTag']

with open('./csv/compare.csv', 'w', encoding='utf-8', newline="") as f:
    writer = csv.writer(f)

    writer.writerow(['grammar_{}'.format(username1_name), 'date_{}'.format(username1_name), 'tag_{}'.format(username1_name), 'link_{}'.format(username1_name), 'hashtag_{}'.format(username1_name), 'time_{}'.format(username1_name), '', 'grammar_{}'.format(username2_name), 'date_{}'.format(username2_name), 'tag_{}'.format(username2_name), 'link_{}'.format(username2_name), 'hashtag_{}'.format(username2_name),
                    'time_{}'.format(username2_name), '', 'grammer_same', 'words_with_similar_annotation', 'total_words', 'Similarity Index'])

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

        similar_to_total_ratio = words_with_similar_annotation / total_words

        row = [grammar_1, date_1, tag_1, link_1, hashtag_1, time_1,
               empty, grammar_2, date_2, tag_2, link_2, hashtag_2, time_2, empty, grammer_same, words_with_similar_annotation, total_words, similar_to_total_ratio]

        writer.writerow(row)
        counter -= 1
        # break
