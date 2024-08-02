# syntax=docker/dockerfile:1

FROM python:3.9-slim-buster

WORKDIR /annotation-flask

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

ENV FLASK_APP=app.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
# CMD ["backend", "app.py"]

EXPOSE 5000/tcp