# Commentator :writing_hand:

- A Code-mixed Multilingual Text Annotation Framework.
- Code-mixing on Hinglish Data.
- Easy extensibility to other code-mixed language pairs such as Gujarati-English, Marathi-English etc., In order to extend COMMENTATOR, please read the Configuration Changes file in the Documents section of this repository.

### 1. Relevant Links :link:

Source Code: [`https://github.com/lingo-iitgn/commentator/`](https://github.com/lingo-iitgn/commentator/)

---

Demo Video: [`https://bit.ly/commentator_video`](https://bit.ly/commentator_video)

---

Live Demo Website: [`https://lingo.iitgn.ac.in:3001`](http://lingo.iitgn.ac.in:3001/login)

---

Project Website: [`https://lingo.iitgn.ac.in/`](https://lingo.iitgn.ac.in/)

---

> Usage

##### As an Annotator

- Sign-Up to create a new annotator account
- Login using the credentials 
- Special Credentials :wink:

      username: commentator
      password: commentator

##### As an admin

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

    REACT_APP_BACKEND_URL=http://<YOUR_BACKEND_IP_ADDRESS>:5000
    OR
    REACT_APP_BACKEND_URL=http://localhost:5000

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

a. Navigate inside frontend folder

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

### 7. Containerization of Backend using Docker :whale2:

##### Steps to Follow

a. Creating a Docker Hub Account and a public repository

> Visit https://hub.docker.com/

b. Updating Dockerfile

    FROM python:3.9-slim-buster
    WORKDIR /commentator
    COPY requirements.txt requirements.txt
    RUN pip3 install -r requirements.txt
    COPY . .
    ENV FLASK_APP=app.py
    CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
    EXPOSE 5000/tcp

b. Push Image to Docker Hub

    docker build . -t python-docker
    docker tag python-docker <DOCKER_USERNAME>/<REPOSITORY_NAME>
    docker push <DOCKER_USERNAME>/<REPOSITORY_NAME>

c. Run Docker server on port 5000

    docker run -dp 5000:5000 <DOCKER_USERNAME>/<REPOSITORY_NAME>

d. List of active docker containers

    docker ps

e. Stop Docker Container by Container ID.

    docker stop <CONTAINER_ID>

---


### 7. Contributors :busts_in_silhouette:

| <img width="75" alt="line" src="https://via.placeholder.com/75x1/000000/000000?text="> |  |  |
| ------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| <img width="75" alt="vs" src="https://github.com/user-attachments/assets/7df1cf63-b61e-4254-9480-c8408799f693"> | Rajvee Sheth | [`https://www.linkedin.com/in/rajvee-sheth`](https://www.linkedin.com/in/rajvee-sheth) |
| <img width="75" alt="tn" src="https://user-images.githubusercontent.com/65038837/126761822-ca949453-540f-40f1-a8cd-9a1ed3e4cae2.jpeg"> | Shubh Nisar | [`https://shubh-nisar.github.io`](https://shubh-nisar.github.io) |
| <img width="75" alt="vs" src="https://github.com/user-attachments/assets/b1e0757c-df7d-4b44-87fe-0ca2fc65adc0">| Heenaben Prajapati | [`https://www.linkedin.com/in/heena-prajapati-4977851a5/`](https://www.linkedin.com/in/heena-prajapati-4977851a5/) |
| <img width="75" alt="tn" src="https://github.com/user-attachments/assets/93682aa1-4eae-47de-937b-74bb8dbb3db9"> | Himanshu Beniwal | [`https://himanshubeniwal.github.io/`](https://himanshubeniwal.github.io/) |
| <img width="75" alt="vs" src="https://github.com/user-attachments/assets/4b517aba-7bad-4234-8744-e90453cbb365"> | Mayank Singh | [`https://mayank4490.github.io/`](https://mayank4490.github.io/) |


### 8. Mentions :eyes:

- https://github.com/microsoft/LID-tool
- https://github.com/sagorbrur/codeswitch
- https://github.com/jiesutd/YEDDA
- https://getmarkup.com/dashboard
- https://inception-project.github.io/
- https://UBIAI.tools/
- https://gate.ac.uk/download/

## Citation

If you use this framework in your research or work, please cite it as follows:

```bibtex
@misc{sheth2024commentatorcodemixedmultilingualtext,
      title={COMMENTATOR: A Code-mixed Multilingual Text Annotation Framework}, 
      author={Rajvee Sheth and Shubh Nisar and Heenaben Prajapati and Himanshu Beniwal and Mayank Singh},
      year={2024},
      eprint={2408.03125},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2408.03125}, 
}
