# Commentator :writing_hand:: A Code-mixed Multilingual Text Annotation Framework.
<!--   <a href="https://lingo.iitgn.ac.in/codemixing/">
    <img alt="Website" src="https://img.shields.io/badge/Project-Website-brightgreen">
  </a> -->
<div align="center">
  <p>
    <a href="https://aclanthology.org/2024.emnlp-demo.11.pdf"><img alt="EMNLP" src="https://img.shields.io/badge/EMNLP-2024-brightgreen"></a>
    <a href="https://github.com/lingo-iitgn/commentator/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache 2.0-blue"></a>
    <a href="https://github.com/lingo-iitgn/commentator/"><img alt="Version" src="https://img.shields.io/badge/version-1.0-blueviolet"></a>
  </p>
</div>


### Overview: 
A code-mixed annotation tool designed to significantly enhance annotation quality and efficiency. It reduces annotation time and operational overheads by providing advanced features tailored for code-mixed data. The tool offers intuitive interfaces, automated suggestions, and robust error-checking mechanisms.

- Specifically designed for annotating code-mixed text.
- Easy extensibility to other code-mixed language pairs such as Gujarati-English, Marathi-English etc., In order to extend COMMENTATOR, please read the Configuration Changes file in the Documents section of this repository.
- For more details, please refer to [`our paper (EMNLP 2024:demo)`](https://aclanthology.org/2024.emnlp-demo.11.pdf).

This GUI annotation tool is built with a ReactJS frontend, a Flask backend, and uses MongoDB for data storage.

To extend Commentator, refer to the `Configuration Changes` file in the **Documents** folder.

---

## 👩‍💻 Interfaces 

It provides both annotator interface for efficient annotatation and admin interface for result export and analysis.

### 👤 Annotator

1. Sign up to create an account  
2. Log in using your credentials

> **Demo Credentials**  
> `username: commentator`  
> `password: commentator`

### 🔑 Admin Access

> `username: admin`  
> `password: admin`

---

## 📁 Folder Structure 

```
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker configuration
│   └── LID_tool/             # Language identification modules
├── frontend/
│   ├── src/
│   │   ├── Admin/            # Admin dashboard components
│   │   ├── Auth/             # Authentication components
│   │   ├── Components/       # Reusable UI components
│   │   ├── Edit/             # Annotation editing interface
│   │   ├── Matrix/           # Matrix analysis components
│   │   ├── POS/              # POS tagging interface
│   │   ├── Home/             # Landing page components
│   │   ├── User/             # User management
│   │   ├── utils/            # Utility functions
│   │   └── Router.js         # Application routing
│   ├── public/               # Static assets
│   └── package.json          # Node.js dependencies
└── README.md
```

##### frontend/src/.env

    REACT_APP_BACKEND_URL=http://<YOUR_BACKEND_IP_ADDRESS>:5000
    OR
    REACT_APP_BACKEND_URL=http://localhost:5000

---

## 📦 Database Schemas

| Collection |        Description                          |
| ---------- | ------------------------------------------- |
|  lid       | LID based Language Identification of Tokens |
|  matrix    | Matrix based Identification of Sentences    |
|  pos       | POS tags based Identification of Tokens     |
|  sentences | Sentences to be annotated                   |
|  users     | Admin & Annotator Accounts                  |


### 🖥️ Backend [ Local Server ] 

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

### 🖥️ Frontend [ Local Server ] 

##### Steps to Follow

a. Navigate inside frontend folder

    cd frontend

b. Install all frontend dependencies post 1st application download.

    npm i

c. Start the frontend local server.

    npm start

> OR click on the frontend bash/shell file to run the frontend local server.

---

## 🔐 Administrative Configuration 

##### Steps to Follow

1. Start Frontend and Backend Local Server. (Refer 4.e & 5.c)
2. Create an admin account.
3. Open MongoDB database and set `admin=True` to create superuser/admin account.
4. Login to Admin Dashboard.
5. Upload sentences to the database (csv).

## 🐳 Containerization of Backend using Docker 

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
## :link: Relevant Links 

Paper Link: [`https://aclanthology.org/2024.emnlp-demo.11.pdf`](https://aclanthology.org/2024.emnlp-demo.11.pdf)

---

Demo Video: [`https://bit.ly/commentator_video`](https://bit.ly/commentator_video)

---

Project Website: [`https://lingo.iitgn.ac.in/codemixing/`](https://lingo.iitgn.ac.in/codemixing/)

---


## 👥 Contributors:

|   | Name | Socials |
|:-:|:-----|:-----|
| <img src="https://github.com/user-attachments/assets/7df1cf63-b61e-4254-9480-c8408799f693" width="75" style="border-radius: 8px;" /> | **Rajvee Sheth** | [linkedin.com/in/rajvee-sheth](https://www.linkedin.com/in/rajvee-sheth) |
| <img src="https://github.com/user-attachments/assets/0489b854-3c8e-479e-9aee-2e1c18b8ee0f" width="75" style="border-radius: 8px;" /> | **Shubh Nisar** | [shubh-nisar.github.io](https://shubh-nisar.github.io) |
| <img src="https://github.com/user-attachments/assets/b1e0757c-df7d-4b44-87fe-0ca2fc65adc0" width="75" style="border-radius: 8px;" /> | **Heenaben Prajapati** | [linkedin.com/in/heena-prajapati-4977851a5](https://www.linkedin.com/in/heena-prajapati-4977851a5/) |
| <img src="https://github.com/user-attachments/assets/93682aa1-4eae-47de-937b-74bb8dbb3db9" width="75" style="border-radius: 8px;" /> | **Himanshu Beniwal** | [himanshubeniwal.github.io](https://himanshubeniwal.github.io/) |
| <img src="https://github.com/user-attachments/assets/4b517aba-7bad-4234-8744-e90453cbb365" width="75" style="border-radius: 8px;" /> | **Mayank Singh** | [mayank4490.github.io](https://mayank4490.github.io/) |



---


### 👀 Mentions 

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
@inproceedings{sheth-etal-2024-commentator,
    title = "Commentator: A Code-mixed Multilingual Text Annotation Framework",
    author = "Sheth, Rajvee  and
      Nisar, Shubh  and
      Prajapati, Heenaben  and
      Beniwal, Himanshu  and
      Singh, Mayank",
    booktitle = "Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing: System Demonstrations",
    month = nov,
    year = "2024",
    address = "Miami, Florida, USA",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2024.emnlp-demo.11",
    pages = "101--109",
}
