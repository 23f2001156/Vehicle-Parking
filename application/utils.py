from jinja2 import Template
import os

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
    
