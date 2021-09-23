const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const app = express();

///////////////////////mongo cluster connection string////////////////////
const uri = 'mongodb+srv://admin:MXXBxlTkCEKVBg@cluster0.gtc6l.mongodb.net/reactJourney?retryWrites=true&w=majority';
mongoose.connect(uri)


app.use(express.json());


//////////////////Schema//////////////////////
const userSchema = mongoose.Schema({
    name:  String,
    lastName: String,
    email:   String,
    mobile: Number,
    groupId:String,
    take: [],
    give: []
})

////////////////////model////////////////
const User = mongoose.model('User',userSchema);



function randomGenrateId(){
    const randomString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for(let i=0; i<15; i++){
        id += randomString[Math.floor(Math.random()*63)];
    }
    return id;
}


async function push(name,amount,mobile,bill,time,task=false){
    if(task) return await User.updateOne({ mobile: mobile}, { $push: {  give:{ name,amount,bill,time }}});
    await User.updateOne({ mobile: mobile}, { $push: {  take:{name,amount,bill,time}}});
}

function filterUserData(task){
    let billArr = [];
    task.forEach(el=>{
       const name =el.name;
       const amount = el.amount;
       const time = el.time;
         billArr.push({name,amount,time})
        })
    task = task.reduce((prev,current)=>(
        prev + current.amount
      ),0);
    return {task, billArr};
    // return billArr;
}

////////////////regiseter a group///////////
app.post('/api/register_group',async (req,res)=>{
    const  data  = req.body;
    const id = randomGenrateId();
    data.forEach(el=>{
        const { name, lastName, email, mobile, take, give} = el;
        const submitObj = { name, lastName, email, mobile, take, give ,groupId :id};

        const user = new User(submitObj);

        user.save((err,doc)=>{
            if(err) return console.log('Invalid')
        })
    
    })
  
    res.status(200).json({
        message:"User data successfully insert."
    })
})


////////////////////distribution of bill/////////// 
app.post('/api/bill_pay',async (req,res)=>{
    const { mobile, amount, bill} = req.body;
    let userId;
    const time = Date.now();
    User.find({mobile},(err,doc)=>{
     if(err) throw err;
     userId = doc[0].groupId;
     userName = doc[0].name;
     User.find({ groupId: { $eq: userId }},(err,doc)=>{
        const partOfAmount = amount/doc.length;
            const updateArray = doc.filter(el=>el.mobile !== mobile)
            
            updateArray.forEach(el=>{
                const friendMobile = el.mobile;
                const friend = el.name;
                push(userName,partOfAmount,friendMobile,bill,time,true);
                push(friend,partOfAmount,mobile,bill,time)
            })
     })
    })
})

////////////////get user data///////////////////
app.get('/api/user_data',(req,res)=>{
    const { mobile } = req.body;
    
    User.find({mobile},async (err,doc)=>{
     let { give, take } = doc[0]
     let takeData = filterUserData(take);
     let giveData = filterUserData(give);
      res.status(200).json({
          take:takeData,
          give:giveData
      })
    })
})


////////////connection////////////////
const port = 3002;
app.listen(port,'localhost',res=>{
    console.log(`server is running at port ${port}`);
})








