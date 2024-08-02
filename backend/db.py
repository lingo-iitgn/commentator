import pandas as pd
import pymongo
import sys


#conn_str = "mongodb://localhost:27017"
conn_str = 'mongodb://127.0.0.1:27017'

# # set a 5-second connection timeout
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
database = client['demon']

sentences_collection = database.get_collection('sentences')

filename = sys.argv[1]
df = pd.read_csv('uploads/{}'.format(filename), header=None)
df = df.iloc[:, 0]
print(df)

last_row_id = 0
print(last_row_id)
prev = sentences_collection.find()
prev = list(prev)
if len(prev) > 0:
    prev = prev[-1]
    print(prev['sid'])
    last_row_id = prev['sid']

for sent in range(len(df)):
    last_row_id += 1

    print(df[sent])
    sentences_collection.insert_one({
        'sentence': df[sent],
        'sid': last_row_id
    })

print('Task Finished')
