# COMMENTATOR :writing_hand:: A Code-mixed Multilingual Text Annotation Framework.
<!--   <a href="https://lingo.iitgn.ac.in/codemixing/">
    <img alt="Website" src="https://img.shields.io/badge/Project-Website-brightgreen">
  </a> -->
<div align="center">
  <p>
    <a href="https://aclanthology.org/2024.emnlp-demo.11.pdf"><img alt="EMNLP" src="https://img.shields.io/badge/EMNLP-2024-brightgreen"></a>
    <a href="https://github.com/lingo-iitgn/commentator/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache 2.0-blue"></a>
    <a><img alt="Version" src="https://img.shields.io/badge/compatible with-python3.10.x-yellow"></a>
    <a href="https://github.com/lingo-iitgn/commentator/"><img alt="Version" src="https://img.shields.io/badge/version-1.0-blueviolet"></a>
  </p>
</div>


**COMMENTATOR** is a code-mixed annotation tool designed to enhance the quality and efficiency of annotating multilingual, code-mixed text. It reduces annotation time and operational overheads by providing advanced features tailored for code-mixed data. The tool offers intuitive interfaces, automated suggestions, and robust error-checking mechanisms.

### 🌟 Features

- Modular Workflows: Supports Admin Workflow (user management, system configuration, progress monitoring) and Annotation Workflow (text annotation, history review).

- User-Friendly Interface: Intuitive UI for annotators and admins.

- Scalable Architecture: Built with ReactJS, Flask, and MongoDB for robust performance.

- Extensibility: Easily extend to new language pairs, refer to the `Configuration Changes` file in the **Documents** folder.

- For more details, please refer to [`our paper (EMNLP 2024:demo)`](https://aclanthology.org/2024.emnlp-demo.11.pdf).

<section>
  <div align="center"> 
      <img width="660" height="442" alt="arch" src="https://github.com/user-attachments/assets/a3d30927-83de-413f-9478-3f6c230dfa36" />
      <h4 class="subtitle has-text-centered">
        Architecture: <strong>COMMENTATOR</strong> features two primary user workflows: <b>Admin workflow</b> and <b>Annotation workflow</b>. The Admin workflow manages user access, system configurations, and monitoring of annotation progress, while the Annotation workflow allows annotators to log in, annotate text, and review their annotation history. Both workflows are integrated into the tool’s modular architecture for efficient management and processing.
      </h4>
  </div>
</section>

---
## 📁 Folder Structure 

```
COMMENTATOR/
├── backend/
│   ├── app.py                # Flask application entry point
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Docker configuration
│   └── LID_tool/             # Language identification modules
├── frontend/
│   ├── src/
│   │   ├── Admin/            # Admin dashboard components
│   │   ├── Auth/             # Authentication components
│   │   ├── Components/       # Reusable UI components
│   │   ├── Edit/             # Annotation editing interface
│   │   ├── Matrix/           # Matrix analysis interface
│   │   ├── POS/              # POS tagging interface
│   │   ├── Home/             # LID page interface
│   │   ├── User/             # User management
│   │   ├── utils/            # Utility functions
│   │   └── Router.js         # Application routing
│   ├── public/               # Static assets
│   └── package.json          # Node.js dependencies
└── README.md
```

### ⚡ Quick Start

Prerequisites

> **Python 3.9.x or 3.10.x**

> **Node.js 12+** [`Download Node.js`](https://nodejs.org/en/download/)

> **MongoDB**

> **Docker** (optional)

**To get started with the project, follow these steps:**

Clone the Repository:
```
git clone https://github.com/lingo-iitgn/commentator.git
cd commentator
```

### Backend [ Local Server ] 

#### Steps to Follow

a. Navigate inside backend folder

    cd backend

b. Installing Dependencies

    pip install -r requirements.txt

c. Updating Frontend URL

> Open `app.py` in a code/text editor (Visual Studio Code, Sublime Text, Notepad etc)

    frontend = YOUR_FRONTEND_HOST_URL
    OR
    frontend = http://localhost:3003

d.  Set up MongoDB connection in `app.py`

Choose one of the following options depending on your setup:
>  For Local Setup:
   Ensure MongoDB is running locally, and set:

    conn_str = YOUR_MONGODB_URL
    OR
    conn_str = "mongodb://127.0.0.1:27017/"

> For Cloud MongoDB (Atlas):
  Create an account:
  👉 [`https://cloud.mongodb.com/`](https://cloud.mongodb.com/)
    
  Set up your Cluster, Database, and User.
    
    Copy your connection string and replace credentials:

    conn_str = "mongodb+srv://<username>:<password>@cluster0.stlpmgf.mongodb.net/?retryWrites=true&w=majority"


e.  Set the database name:

> If you want to Change or modify to a specific database, update this line in `app.py`:

    database = client['sentences_EMNLP24']
    
   Replace 'sentences_EMNLP24' with your preferred database name as needed.


f. Running the local server

    python app.py
    OR
    python3 app.py
    
---

### Frontend [ Local Server ] 

#### Steps to Follow

a. Update frontend/src/.env with your backend URL:

    REACT_APP_BACKEND_URL=http://<YOUR_BACKEND_IP_ADDRESS>:5000
    OR
    REACT_APP_BACKEND_URL=http://localhost:5000

b. Navigate inside frontend folder

    cd frontend

c. Install all frontend dependencies post 1st application download.

    npm i 

d. Start the frontend local server.

    npm start

---

## 🔐 Administrative Configuration 

#### Steps to Follow

1. **Start Frontend and Backend Servers**
   - Refer to the *Frontend Setup* section for frontend instructions.
   - Refer to the *Backend Setup* section for backend setup.

2. **Create an Admin Account**
   - Register a new account through the application’s interface.

3. **Set Admin Privileges in MongoDB**
   - Access your MongoDB database.
   - Locate the user document in the relevant collection.
   - Update the user document to set `admin: true` to grant admin privileges for data management.

4. **Log in to the Admin Dashboard**
   - Use the admin account credentials to access the dashboard.

5. **Upload Sentences to the Database**
   - Use the admin dashboard to upload sentences via a `.csv` or `.txt` file.

---

## 🐳 Containerization of Backend using Docker 

#### Steps to Follow

A. Creating a Docker Hub Account and a public repository

> Visit https://hub.docker.com/

B. Updating Dockerfile

    FROM python:3.9-slim-buster
    WORKDIR /commentator
    COPY requirements.txt requirements.txt
    RUN pip3 install -r requirements.txt
    COPY . .
    ENV FLASK_APP=app.py
    CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
    EXPOSE 5000/tcp

C. Push Image to Docker Hub

    docker build . -t python-docker
    docker tag python-docker <DOCKER_USERNAME>/<REPOSITORY_NAME>
    docker push <DOCKER_USERNAME>/<REPOSITORY_NAME>

D. Run Docker server on port 5000

    docker run -dp 5000:5000 <DOCKER_USERNAME>/<REPOSITORY_NAME>

E. List of active docker containers

    docker ps

F. Stop Docker Container by Container ID.

    docker stop <CONTAINER_ID>
---

## 🔧 Troubleshooting (Common Issues)

- 1. Port Already in Use
    ```
    bash# Kill process on port 5000
    lsof -ti:5000 | xargs kill -9
    ```
- 2. MongoDB Connection Error

    *Ensure MongoDB is running on the specified connection string.*

- 3. Docker Build Failed

  *Check Docker daemon is running and Dockerfile syntax is correct.*

- 4. Frontend Build Error

    *Delete the node_modules folder and reinstall:* 
    ```
     rm -rf node_modules && npm install --legacy-peer-deps
    ```
- 5. Backend Build Error

    *Ensure all dependencies in requirements.txt are correctly installed.*

---

## 👩‍💻 Interfaces 

It provides both annotator interface for efficient and faster annotation and admin interface for result export and analysis.

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

## 📦 Database Schemas

| Collection |        Description                          |
| ---------- | ------------------------------------------- |
|  lid       | Language Identification at Token level      |
|  matrix    | Matrix based Identification of Sentences    |
|  pos       | POS tags based Identification of Tokens     |
|  sentences | Sentences to be annotated                   |
|  users     | Admin & Annotator Accounts                  |

---

## :link: Relevant Links 

Paper Link: [`EMNLP 2024 Demo Paper`](https://aclanthology.org/2024.emnlp-demo.11.pdf)

Demostration: [`Demo Video`](https://bit.ly/commentator_video)

Explore the Project: [`Project Website`](https://lingo.iitgn.ac.in/codemixing/)

---


## 👥 Contributors

Meet the talented team behind the project!
| Contributor | Name | Links |
|:------:|:-----------:|:-----:|
| <img src="https://github.com/user-attachments/assets/7df1cf63-b61e-4254-9480-c8408799f693" width="80" style="border-radius: 50%;" /> | **Rajvee Sheth** | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rajvee-sheth/) |
| <img src="https://github.com/user-attachments/assets/0489b854-3c8e-479e-9aee-2e1c18b8ee0f" width="80" style="border-radius: 50%;" /> | **Shubh Nisar** | [![Website](https://img.shields.io/badge/Website-4285F4?style=plastic&logo=google-chrome&logoColor=white)](https://shubh-nisar.github.io/) |
| <img src="https://github.com/user-attachments/assets/b1e0757c-df7d-4b44-87fe-0ca2fc65adc0" width="80" style="border-radius: 50%;" /> | **Heenaben Prajapati** | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/heena-prajapati-4977851a5/) |
| <img src="https://github.com/user-attachments/assets/93682aa1-4eae-47de-937b-74bb8dbb3db9" width="80" style="border-radius: 50%;" /> | **Himanshu Beniwal** | [![Website](https://img.shields.io/badge/Website-4285F4?style=plastic&logo=google-chrome&logoColor=white)](https://himanshubeniwal.github.io/) |
| <img src="https://github.com/user-attachments/assets/4b517aba-7bad-4234-8744-e90453cbb365" width="80" style="border-radius: 50%;" /> | **Mayank Singh** | [![Website](https://img.shields.io/badge/Website-4285F4?style=plastic&logo=google-chrome&logoColor=white)](https://mayank4490.github.io/) |

---

### 👀 Mentions 

- https://github.com/microsoft/LID-tool
- https://github.com/sagorbrur/codeswitch
- https://github.com/jiesutd/YEDDA
- https://getmarkup.com/dashboard
- https://inception-project.github.io/
- https://UBIAI.tools/
- https://gate.ac.uk/download/

---

## **📄 License**

This project is licensed under the **Apache-2.0 license** - see the [LICENSE](LICENSE) file for details.


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
