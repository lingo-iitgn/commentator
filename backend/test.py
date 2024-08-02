from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")

print("Connection Successful")
print(client.list_database_names())
client.close()