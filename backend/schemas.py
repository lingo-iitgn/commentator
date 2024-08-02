import pymongo

#conn_str = "mongodb://localhost:27017"
conn_str = 'mongodb://127.0.0.1:27017';
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
database = client['demon']

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
