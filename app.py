from fastapi import FastAPI,Request,Response,HTTPException,Depends,UploadFile,File,Form
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema,MessageType
from sqlalchemy.orm import Session
from sqlalchemy import text
from security import hash_password,verify_password
from database import get_db,Token,Registration,Password,mail,Payment
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from starlette.middleware.sessions import SessionMiddleware
import secrets
import hashlib
from datetime import datetime,timedelta,timezone
import uuid
from fastapi.staticfiles import StaticFiles
import razorpay
from razorpay.errors import SignatureVerificationError

load_dotenv()

app=FastAPI()

app.mount("/uploads/Resumes", StaticFiles(directory='uploads/Resumes'), name="uploads/Resumes")

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
    https_only=False
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

client = razorpay.Client( auth=(
        os.getenv("RAZORPAY_KEY_ID"),
        os.getenv("RAZORPAY_KEY_SECRET")
    ))

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
        id = str(uuid.uuid4())
        response=db.execute(text('execute dbo.insert_user @Candidate_ID=:id,@Email=:email,@Password=:password,@Email_Verified=:val'),
                            {'id':id,'email':user.Email,'password':encrypt,'val':0}).all()
        db.commit()
        db.execute(text('insert into User_Files(Email) values(:email)'),{'email':user.Email})
        db.commit()
        if len(response)==0:
            raise HTTPException(status_code=404,
                                detail='Data could not be inserted.')
        else:
             url_token= secrets.token_urlsafe(32)
             hashed_token = hashlib.sha256(url_token.encode('utf-8')).hexdigest()
             expiry = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
            
             res=db.execute(text('execute dbo.insert_token @Token=:token,@Expiry=:expiry,@Email=:email'),
                            {'token':hashed_token,'expiry':expiry.replace(tzinfo=None),'email':user.Email}).all()
             db.commit()
             print(res)
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

@app.post('/verify-email')
async def verify(t:Token,db:Session=Depends(get_db)):
     
     hashed_token = hashlib.sha256(t.token.encode('utf-8')).hexdigest()
     time = datetime.now(timezone.utc).replace(tzinfo=None)
     
     result=db.execute(text('select * from OAuth where Token=:hashed_token'),
                       {'hashed_token':hashed_token}).all()
     db.commit()
     print(result)
     if len(result)==0:
         raise HTTPException(status_code=416,detail='Token does not exists.')
    
     db.execute(text('Delete from OAuth where Token=:token'),
                {'token':hashed_token})
     db.commit()
     if result[0][1]<time:
         #delete from Register Table.
          db.execute(text('Delete from Register where Email=:email'),
                         {'email':result[0][2]})
          db.commit()
          raise HTTPException(status_code=417,detail='Token validity expired!')
     #update Regsiter table email verified column.
     db.execute(text('Update Register set Email_Verified=:number where Email=:email'),
                {'number':1,'email':result[0][2]})
     db.commit()
     return {'message':'Email successfully verified.'}

@app.post('/logout')
async def logout(request:Request,response:Response):
    request.session.clear()
    response.delete_cookie(key='session')
    return {'message':'User logged out.'}

@app.post('/candidate/login')
def login(user:Registration,request:Request,db:Session=Depends(get_db)):
   
    result= db.execute(text('Select Candidate_ID,Email,Password,Email_Verified from Register where email=:email'),
                          {'email':user.Email}).all()
    db.commit()
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
    print(request.session.get('email'))
    if request.session.get('user_id') is None:
        raise HTTPException(status_code=410,detail='Session is not created!')
    
    return {'message':request.session.get('email'),}

@app.post('/admin/login')
def admin_login(admin:Registration,request:Request,db:Session=Depends(get_db)):
    
     admin_email=os.getenv('ADMIN_EMAIL')
     admin_password=os.getenv('ADMIN_PASSWORD')
     if(admin.Email!=admin_email or admin.password!=admin_password):
         raise HTTPException(status_code=400,detail='admin credential does not match!')
    #  if not verify_password(admin.password,result[0][2]):
    #      raise HTTPException(status_code=407,detail='Passwords do not match!')
    
     request.session.clear()
     request.session['email']=admin.Email
     request.session['role']='admin'
     
     if  request.session.get('email') is None:
         raise HTTPException(status_code=410,detail='Sesion not created')
     
     return {'message':request.session.get('email')}

@app.post('/password_recovery')
async def update(email:mail,db:Session=Depends(get_db)):
    #first ceck weter email is reistered or not
    result=db.execute(text('Select * from Register where Email=:email'),
                      {'email':email.Email})
    db.commit()
    if not result:
        raise HTTPException(status_code=416,detail='email is not registered')
   
    url_token= secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(url_token.encode('utf-8')).hexdigest()
    expiry=datetime.now(timezone.utc).replace(tzinfo=None)+timedelta(minutes=10)
    
    res=db.execute(text('execute dbo.insert_token @Token=:token,@Expiry=:expiry,@Email=:email'),
                   {'token':hashed_token,'expiry':expiry,'email':email.Email})
    db.commit()
    password_reset_link=f'http://localhost:5173/verify-password?token={url_token}'

    #send email to user.
    message =MessageSchema(
                subject='Password recovery.',
                recipients=[email.Email],
                body='<h1>Click on this link to update password '+ password_reset_link+'</h1>',
                subtype=MessageType.html
            )
    fm=FastMail(conf)
    await fm.send_message(message)
    
    return {'message':'Password reset mail sent.Link valid for 10 minutes'}

@app.post('/update-password')
def password(pt:Password,db:Session=Depends(get_db)):

    hashed_token = hashlib.sha256(pt.token.encode('utf-8')).hexdigest()
    expiry = datetime.now(timezone.utc).replace(tzinfo=None)

    result=db.execute(text('Select * from OAuth where Token=:token and Expiry >=:expiry'),
                      {'token':hashed_token,'expiry':expiry}).all()
    db.commit()
    if not result:
        raise HTTPException(status_code=418,detail='Token expired')
    
    db.execute(text('Delete from OAuth where Token=:token'),
               {'token':hashed_token})
    db.commit()
    encrypt=hash_password(pt.password)

    db.execute(text('Update Register set Password=:encrypt where Email=:email;'),
                   {
                       'encrypt':encrypt,'email':result[0][2]
                   })
    db.commit()
    
    passwo = db.execute(text('Select Password from Register where Email=:email;'),{'email':result[0][2]}).all()
    db.commit()
    if not verify_password(pt.password,passwo[0][0]):
        raise HTTPException(status_code=421,detail='Password not updated!')
    
    return  {'message':'Password updated successfully'}

@app.post('/user_data')
def user_data(Email:mail,req:Request,db:Session=Depends(get_db)):
     if req.session.get('email') is  None:
         raise HTTPException(status_code=613,detail='Not in!')
     if Email.Email != req.session.get('email'):
         raise HTTPException(status_code=612,detail="Not admin!")
     rows=db.execute(text('Select R.Candidate_ID,R.Email,R.Email_Verified,R.UserName,R.Phone,R.Father_Name,R.Address,R.Profession,R.Paid,F.Resume from Register as R left Join User_Files as F on R.Email=F.Email;')).mappings().all()
     return {'data':rows}

@app.post('/data')
def data(req:Request,db:Session=Depends(get_db)):
    result=db.execute(text('Select UserName,Phone,Father_Name,Address,Profession from Register where Email=:email'),{'email':req.session.get("email")}).mappings().all()
    db.commit()
    if  len(result)==0:
        raise HTTPException(status_code=532,detail="No data found")
    print(result)
    dat=[dict(row) for row in result]
    return {'message':dat}

@app.put('/update-profile')
async def update_profile(  req:Request,
                         UserName: str = Form(...),
                         Phone: int = Form(...),
                         Address: str = Form(...),
                         Father_Name: str = Form(...),
                         Profession: str = Form(...),
                         Resume:UploadFile=File(None),
                         Photo:UploadFile=File(None),
                         db:Session=Depends(get_db)):

    resume_path=''
    email=''
    photo_path=''

    if  req.session.get('email') is None:
        print("not logged in!")
        raise  HTTPException(status_code=666,detail="no session user!")
    else:
        email=req.session.get('email')

    if Resume and Resume.filename:
       content = await Resume.read()
       timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
       name=f'{timestamp}.pdf'
       resume_path = os.path.join("uploads", "Resumes", name)
       with open(resume_path, "wb") as f:
           xxx = db.execute(text('Select Resume from User_Files where Email=:email'),{'email':email}).all()
           if len(xxx)!=0:
              os.remove(xxx[0][0])
           f.write(content)
       db.execute(text('UPDATE User_Files SET Resume = :resume WHERE Email = :email'),
                      { "resume": resume_path,
                        "email": email})
       db.commit()

    if Photo and Photo.filename:
        content = await Photo.read()
        timestamp=datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        name = f'{timestamp}.{os.path.splitext(Photo.filename)[1]}'
        photo_path=os.path.join('uploads','Photos',name)
        with open(photo_path, "wb") as f:
                   xxx = db.execute(text('Select Photo from User_Files where Email=:email'),{'email':email}).all()
                   db.commit()
                   if len(xxx)!=0:
                        print(xxx[0][0])
                        os.remove(xxx[0][0])
                   f.write(content)
        db.execute(text('UPDATE User_Files SET  Photo = :photo WHERE Email = :email'),
                      { "photo": photo_path,
                        "email": email})
        db.commit()

    db.execute(text('update Register set UserName=:username,Address=:address,Profession=:pro,Father_Name=:fat,Phone=:p where Email=:email'),
               {'username':UserName,
                'address':Address,
                'pro':Profession,
                'fat':Father_Name,
                'p':Phone,
                'email':email})
    db.commit()

    return {'message':'Profile updated!'}

@app.post('/check-payment')
def check(req:Request,db:Session=Depends(get_db)):
    if req.session.get('email') is None:
        raise HTTPException(status_code=999,detail='Security breached')
    result=db.execute(text('Select Paid from Register where Email=:email'),{'email':req.session.get('email')}).mappings().all()
    if result[0].Paid is None:
        return {'message':True}
    else:
        return {"message":False}

@app.post('/create-order')
def create(req:Request,db:Session=Depends(get_db)):
        email = req.session.get("email")
        if not email:
           raise HTTPException(status_code=401)
        amount = os.getenv("AMOUNT")

        order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1
    })

        return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID")
    }

@app.post('/verify-payment')
async def verify(details:Payment,req:Request,db:Session=Depends(get_db)):
    
    try:
        client.utility.verify_payment_signature({
         'razorpay_order_id': details.razorpay_order_id,
         'razorpay_payment_id': details.razorpay_payment_id,
         'razorpay_signature': details.razorpay_signature
     })
        #i will update paid column in table 
    except SignatureVerificationError:
             print(SignatureVerificationError)
             raise HTTPException(
            status_code=400,
            detail="Invalid payment signature"
        )
    payment = client.payment.fetch(
    details.razorpay_payment_id
)

    expected_amount = 100
 
# Verify order ID
    if payment["order_id"] != details.razorpay_order_id:
         raise HTTPException(401, "Order ID mismatch")

# Verify payment status
    if payment["status"] != "captured":
         raise HTTPException(402, "Payment not captured")

# Verify amount
    print(payment["amount"])
    if payment["amount"] != expected_amount:
         raise HTTPException(403, "Incorrect payment amount")

# Verify currency
    if payment["currency"] != "INR":
         raise HTTPException(404, "Invalid currency")
    email = req.session.get('email')
    db.execute(text('Update Register set Paid=:paid where Email=:email'),{'paid':'YES','email':email})
    db.commit()

    return {'message':'Payment is Done'}

@app.get('/check-session')
def check(req:Request):
    print(req.session)
    if  req.session.get('email') is None:
       return {'logged_in':False,'email':'','role':''}
    else:
        return {'logged_in':True,'email':req.session.get('email'),'role':req.session.get('role')}