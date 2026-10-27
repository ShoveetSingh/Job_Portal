from fastapi import FastAPI,Request,Response,HTTPException,Depends
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from sqlalchemy.orm import Session
from sqlalchemy import text
from security import hash_password,verify_password
from database import get_db,Token,Registration,Password
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from starlette.middleware.sessions import SessionMiddleware
import secrets
import hashlib
from datetime import datetime,timedelta,timezone


load_dotenv()

app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv('SESSION_SECRET'),
    session_cookie='session',
    max_age=3600,
    same_site='lax',
    https_only=True
)

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_FROM=os.getenv('MAIL_FROM'),
    MAIL_PORT=os.getenv('MAIL_PORT'),
    MAIL_SERVER=os.getenv('MAIL_SERVER'),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)


@app.post('/candidate/register')
async def create_user(user:Registration,db:Session=Depends(get_db)):
    result= db.execute(text('Select 1 from register where email=:email'),
                      {'email':user.Email}).all()
    if len(result)!=0:
        raise HTTPException(status_code=409,
                            detail='User with this mail id already exists!'
                            )
        
    else:
        encrypt=hash_password(user.password)
        response=db.execute(text('execute dbo.insert_user @Email=:email,@Password=:password,@Email_Verified=:val'),
                            {'email':user.Email,'password':encrypt,'val':0}).all()
        db.commit()
        if len(response)==0:
            raise HTTPException(status_code=404,
                                detail='Data could not be inserted.')
        else:
             url_token= secrets.token_urlsafe(32)
             hashed_token = hashlib.sha256(url_token.encode('utf-8')).hexdigest
             expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
             res=db.execute(text('execute dbo.insert_token @Token=:token,@Expiry=:expiry,@Email=email'),
                            {'token':hashed_token,'expiry':expiry.replace(tzinfo=None),'email':user.Email})
             if len(res)==0:
                 raise HTTPException(status_code=412,detail='Token cannot be stored in db.')
             verification_link = f"http://localhost:5173/verify-email?token={url_token}"
             message =MessageSchema(
            subject='Congratulations user you have successfully registered.',
            recipients=[user.Email],
            body='<h1>Your password is '+user.password+
                 ' and user id is '+response[0][0]+
                 'plz click on this link to verify ur email.'
                 +verification_link +'</h1>',
            subtype=MessageType.html
        )
             fm=FastMail(conf)
             await fm.send_message(message)
             return {'message':'User registered! Mail sent.'}

@app.post('/candidate/verify')
async def verify(t:Token,db:Session=Depends(get_db)):
     hashed_token = hashlib.sha256(t.token.encode('utf-8')).hexdigest
     time = datetime.now(timezone.utc)
     result=db.execute(text('select * from OAuth where token=:hashed_token;'),
                       {'hashed_token':hashed_token}).all()
     
     if len(result)==0:
         raise HTTPException(status_code=416,detail='Token does not exists.')
     db.execute(text('Delete * from OAuth where Token=:token'),
                {'token':hashed_token})
     if result[0][1]<time:
         #delete from Register Table.
          db.execute(text('Delete * from Register where Email=:email'),
                         {'email':result[0][2]})
          raise HTTPException(status_code=417,detail='Token validity expired!')
     #update Regsiter table email verified column.
     db.execute(text('Update Register set Email_Verified=:number where Email=:email'),
                {'number':1,'email':result[0][2]})
     return {'message':'Email successfully verified.'}

@app.post('/logout')
async def logout(request:Request,response:Response):
    request.session.clear()
    response.delete_cookie(key='session')
    return {'message':'User logged out.'}

@app.get('/candidate/login')
def login(user:Registration,request:Request,db:Session=Depends(get_db)):
    result= db.execute(text('Select id,Email,Password,Email_Verified from Register where email=:email'),
                          {'email':user.Email}).all()
    if len(result)==0:
        raise HTTPException(status_code=400,detail='User account does not exist!!')  
    if result[0][3]==0:
        raise HTTPException(status_code=419,detail='User Email is not verified before signin!')
    if not verify_password(user.password,result[0][2]):
        raise HTTPException(status_code=407,detail="Passwords do not match!")
    request.session.clear()
    request.session['user_id']=result[0][0]
    request.session['email']=result[0][1]
    request.session['role']='candidate'
    if request.session.get('user_id') is None:
        raise HTTPException(status_code=410,detail='Session is not created!')
    return {'message':request.session.get('user_email'),}

@app.get('/admin/login')
def admin_login(admin:Registration,request:Request,db:Session=Depends(get_db)):
     result=db.execute('Select * from Admin where Email=:email',
                       {'email':admin.Email})
     if len(result)==0:
         raise HTTPException(status_code=400,detail='admin email does not match!')
     if not verify_password(admin.password,result[0][2]):
         raise HTTPException(status_code=407,detail='Passwords do not match!')
     request.session.clear()
     request.session['email']=admin.Email
     request.session['role']='admin'
     if  request.session.get('email') is None:
         raise HTTPException(status_code=410,detail='Sesion not created')
     return {'message':request.session.get('email')}

@app.post('/candidate/password_recovery')
def update(email:str,db:Session=Depends(get_db)):
    #first ceck weter email is reistered or not
    result=db.execute(text('Select * from Register where Email=:email'),
                      {'email':email})
    if not result:
        raise HTTPException(status_code=416,detail='email is not registered')
    url_token= secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(url_token.encode('utf-8')).hexdigest
    expiry=datetime(timezone.utc)+timedelta(minutes=10)
    res=db.execute(text('execute dbo.insert_token @Token=:token,@Expiry=:expiry,@Email=:email'),
                   {'token':hashed_token,'expiry':expiry,'email':email})
    password_reset_link=f'{url_token}'

    #send email to user.
    
    return {'message':'Password reset mail sent.Link valid for 10 minutes'}

@app.put('/candidate/password_update')
def password(pt:Password,db:Session=Depends(get_db)):
    
    return  

