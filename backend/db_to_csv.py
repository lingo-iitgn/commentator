import csv
import pymongo
import sys

# conn_str = os.environ.get('DATABASE_URL')
#conn_str = "mongodb://localhost:27017"

conn_str = 'mongodb+srv://kareena:y8brZuYzayJwhur3@cluster0.joeeqj9.mongodb.net/';
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
database = client['database_27sep23']

print(database.list_collection_names())

users_collection = database.get_collection('users')

username = sys.argv[1]
print('username = ', username)

user = users_collection.find({'username': username})
user = list(user)
print(user)
sentTag = user[0]['sentTag']

with open('./csv/data.csv', 'w', encoding='utf-8', newline="") as f:
    writer = csv.writer(f)

    writer.writerow(['grammar', 'date', 'tag', 'link', 'hashtag', 'time'])

    for sentence in sentTag:
        # print(sentence)
        grammar = sentence[0]
        date = sentence[1]
        tag = sentence[2]
        link = sentence[3]
        hashtag = sentence[4] if sentence[4] else []
        time = sentence[5]
        row = [grammar, date, tag, link, hashtag, time]

        writer.writerow(row)
        # break
