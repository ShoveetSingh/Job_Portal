from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from pydantic import BaseModel


class Password:
    password:str
    token:str


class Registration:
    Email:str
    password:str

class Token:
    token:str

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=SHOVEET-DESKTOP\SQLEXPRESS2019;"
    "DATABASE=Candidates_db;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

connection_url = (
    "mssql+pyodbc:///?odbc_connect="
    + quote_plus(connection_string)
)

engine=create_engine(connection_url)

sessionlocal=sessionmaker(
    bind= engine,
    autoflush=False,
)

def get_db():
    db=sessionlocal()
    try:
        yield db
    finally:
        db.close()

with engine.connect() as connection:
    result = connection.execute(text("SELECT @@VERSION"))
    print("Connected successfully!")
    print(result.scalar())