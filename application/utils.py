from jinja2 import Template
import os
import requests
def roles_list(roles):
    role_list = []
    for role in roles:
        role_list.append(role.name)
    return role_list

def format_report(html_template, data):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    full_template_path = os.path.join(current_dir, '..', html_template)
    
    with open(full_template_path) as file: 
        template = Template(file.read())
        return template.render(**data) 
    


def send_gchat_notification(username, message):
    webhook_url = "https://chat.googleapis.com/v1/spaces/AAQANUDtcQk/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=sYvUPeltiSJ6uFbOcQIC85VeCZK7f7iMbiIFbBOwC9g"  # Replace with your actual webhook
    text = f"Hi {username}, {message}"
    requests.post(webhook_url, json={"text": text})