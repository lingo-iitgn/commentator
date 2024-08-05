# Commentator

- A Code-mixed Multilingual Text Annotation Framework.
- Code-mixing on Hinglish Data.
- Easy extensibility to other code-mixed language pairs such as Gujarati-English, Marathi-English etc.

### 1. Relevant Links :link:

Source Code: [`https://github.com/lingo-iitgn/commentator/`]([https://github.com/lingo-iitgn/commentator/])

---

Live Demo: [`https://bit.ly/4cfqgyD`](https://bit.ly/4cfqgyD)

---

Live Demo Website: [`https://lingo.iitgn.ac.in/`](https://lingo.iitgn.ac.in/)

> Usage

##### As an Annotator

- Sign-Up to create a new annotator account
- Login using the credentials

##### As an Admin

- Special Credentials :wink:

      username: admin
      password: admin

---

### 2. Folder Structure :books:

```
backend
	app.py
	requirements.txt
	Dockerfile
	LID_tool
fronend
	build
	node_module
	public
	src
		Admin
		Auth
		Components
		Edit
    Matrix
    POS
		Home
		User
		utils
		Router.js
	.env
	.ignore
	package-lock.json
	package.json
```

##### frontend/src/.env

    REACT_APP_BACKEND_URL=http://<YOUR_BACKEND_IP_ADDRESS>:5010
    OR
    REACT_APP_BACKEND_URL=http://localhost:5010

---

### 3. Database Schemas :department_store:

|           |                                             |
| --------- | ------------------------------------------- |
| lid       | LID based Language Identification of Tokens |
| matrix    | Matrix based Identification of Sentences    |
| pos       | POS tags based Identification of Tokens     |
| sentences | Sentences to be annotated                   |
| users     | Admin & Annotator Accounts                  |


### 4. Backend [ Local Server ] :computer:

##### Steps to Follow

a. Navigate inside backend folder

    cd backend

b. Installing Dependencies

    pip install -r requirements.txt

c. Updating Frontend URL

> Open `app.py` in a code/text editor (Visual Studio Code, Sublime Text, Notepad etc)

    frontend = YOUR_FRONTEND_HOST_URL
    OR
    frontend = http://localhost:3003

d. Updating MongoDB URL

> Open `app.py` in a code/text editor (Visual Studio Code, Sublime Text, Notepad etc)

    conn_str = YOUR_MONGODB_URL
    OR
    conn_str = "mongodb://127.0.0.1:27017/"

e. Running the local server

    python app.py
    OR
    python3 app.py

---

### 5. Frontend [ Local Server ] :computer:

##### Steps to Follow

a. Navigate inside backend folder

    cd frontend

b. Install all frontend dependencies post 1st application download.
npm i

c. Start the frontend local server.

    npm start

> OR click on the frontend bash/shell file to run the frontend local server.

---

### 6. Administrative Configuration :passport_control:

##### Steps to Follow

1. Start Frontend and Backend Local Server. (Refer 4.e & 5.c)
2. Create an admin account.
3. Open MongoDB database and set `admin=True` to create superuser/admin account.
4. Login to Admin Dashboard.
5. Upload sentences to the database (csv).


### 7. Mentions :eyes:

- https://github.com/microsoft/LID-tool
- https://github.com/sagorbrur/codeswitch
- https://github.com/jiesutd/YEDDA
- https://getmarkup.com/dashboard
- https://inception-project.github.io/
- https://UBIAI.tools/
- https://gate.ac.uk/download/
