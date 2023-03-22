let express=require("express")
let passport = require("passport")
let jwt = require("jsonwebtoken")

let JwtStratergy = require("passport-jwt").Strategy
let ExtractJwt = require("passport-jwt").ExtractJwt
let app=express();
app.use(express.json());
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin","*")
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
    );
    res.header("Access-Control-Expose-Headers","X-Auth-Token")
    res.header(
        "Access-control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept,Authorization"
    )
    next();
});



app.use(passport.initialize())
const port = process.env.PORT || 2410;

const http = app.listen(port,()=>console.log(`Node App Listening on port ${port}!`));

const io =require("socket.io")(http,
    {
    cors: {
      origin: "https://an8task-3f3c5.web.app",
        
    },
  });


const params = {
  jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey : "jwtsecret123445678"
}
let loginUser = ""
const jwtExpirySeconds =30000;

let strategyUser = new JwtStratergy(params, function(token,done){
  console.log("In Jwt strategy ",token)
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err)
        else {
            let chats=JSON.parse(data)
            let user = chats.find((st)=>st.id===token.id)  
            console.log(user)
    if(!user)
    return done(null,false,{message: "Incorrect username or password"})
    else return done(null,user)
        }
    })
})

passport.use("roleUser",strategyUser)

const {chatdata}=require("./whatsappData.js")
let fs= require("fs");
let fname="whatsapp.json";
const users = []

app.get("/resetData",function(req,res){
    let data= JSON.stringify(chatdata)
    fs.writeFile(fname,data,function(err){
        if(err) res.status(404).send(err)
        else res.send("Data in file is reset")
    })
})



app.post("/login",async function(req,res){
    let {mobile,password}=req.body
    try{
        console.log(mobile,password)
        let data = await fs.promises.readFile(fname)
        let chats = JSON.parse(data)
        let user = chats.find((st)=>(st.mobile===+mobile) && st.password===password )
        if(user){
          console.log(user)
          let payload = {id:user.id}
            let token = jwt.sign(payload, params.secretOrKey,{
                algorithm:"HS256",
                expiresIn : jwtExpirySeconds,
            }) 
            let data2=JSON.stringify(chats);
           await fs.promises.writeFile(fname,data2)
            res.send({token: "bearer "+token})
        }
        else res.sendStatus(401)
      }
      catch(err){
          console.log(err)
      }   
  })

  app.get("/chatuser",passport.authenticate("roleUser",{session:false}),async function(req,res){
    console.log("In GET /user",req.user)
    console.log(req.user)
    try{
        let chats = await fs.promises.readFile(fname,"utf8")
        let data1 = JSON.parse(chats)
        let chatdata = data1.find((st)=>st.id===req.user.id)
        res.send(chatdata)
    }
    catch(error){
        res.status(404).send(error)
      }
  })

  app.get("/chatuser1",async function(req,res){
    try{
        let chats = await fs.promises.readFile(fname,"utf8")
        let data1 = JSON.parse(chats)
        let chatdata = data1.find((st)=>st.id===97)
        res.send(chatdata)
    }
    catch(error){
        res.status(404).send(error)
      }
  })

  

/*app.post("/chat",passport.authenticate("roleUser",{session:false}),async function(req,res){
    let {mobile,message}=req.body
    try{
        
        let chats = await fs.promises.readFile(fname,"utf8")
        let data1 = JSON.parse(chats)
        let chatdata = data1.find((st)=>st.id===req.user.id)
        let friend = chatdata.contact.find((st)=>st.mobile===+mobile)
        friend.message.push({type:"rcv",msg:message})
        let chatdata2 = data1.find((st)=>st.mobile===+mobile)
        let friend2 = chatdata2.contact.find((st)=>st.mobile===+chatdata.mobile)
        friend2.message.push({type:"send",msg:message})
        let data2=JSON.stringify(data1); 
        await fs.promises.writeFile(fname,data2)
        res.send(data2)
    }
    catch(error){
        res.status(404).send(error)
      */
        
  io.on('connection',(socket)=> {
      console.log("connected ",socket.id);
        socket.on("send",async function(msg){
        console.log(msg)
        socket.join()
        console.log(users)
        let {mobile,message,id,time,filetype,file}=msg
       
        let img = "";
        if(filetype!=="text"){
        img = file.toString("base64")
        console.log(img)
        }
        let chats = await fs.promises.readFile(fname,"utf8")
        let data1 = JSON.parse(chats)
        let chatdata = data1.find((st)=>st.id===+id)
        socket.join(chatdata.mobile)
      
        let friend = chatdata.contact.find((st)=>st.mobile===+mobile)
        if(filetype==="text"){
        friend.message.push({type:"rcv",msg:message,time:time,filetype:filetype})
        }
        else{
          friend.message.push({type:"rcv",msg:message,time:time,filetype:filetype,file:img}) 
        }
        let chatdata2 = data1.find((st)=>st.mobile===+mobile)
        let friend2 = chatdata2.contact.find((st)=>st.mobile===+chatdata.mobile)
        if(filetype==="text"){
          friend2.message.push({type:"send",msg:message,time:time,filetype:filetype})
        }
        else{
          friend2.message.push({type:"send",msg:message,time:time,filetype:filetype,file:img,download:false})
        }
        let data2=JSON.stringify(data1);
        await fs.promises.writeFile(fname,data2)
        let chatdata4 = data1.find((st)=>st.mobile===+mobile)
        let chatdata5 = data1.find((st)=>st.id===+id)
       let chatdata3 = chatdata4.contact.find((st)=>st.mobile===+chatdata.mobile)
       let chatdata6 = chatdata5.contact.find((st)=>st.mobile===+mobile)
       // io.to(mobile).emit("receive-msg",data1)
       io.to(mobile).emit("receive-msg",{msgData:chatdata4,userData:chatdata3})
       io.to(chatdata.mobile).emit("receive-msg",{msgData:chatdata5,userData:chatdata6})
    })
    socket.on("connect11",function(user1){
      console.log(user1)
      let index = users.findIndex((st)=>st===user1)
      socket.join(user1)
      console.log(index)
      if(index<0 ){
     users.push(user1)
     console.log("uyuyiiu")
      }
      console.log(users)
     io.emit("online11",users)
    })
    socket.on("disconnect11",function(user1){
      let index = users.findIndex((st)=>st===user1)
      users.splice(1,index)
      io.emit("ofline11",users)
     })
    socket.on("join-msg",async function(msg){
      console.log("connected",msg)
      let {mobile,id}=msg
      let chats = await fs.promises.readFile(fname,"utf8")
      let data1 = JSON.parse(chats)
     // let chatdata = data1.find((st)=>st.id===+id)
     //let friend = chatdata.contact.find((st)=>st.mobile===+mobile)
      io.emit("msg",data1)
    })
    socket.on("downloadImg",async function(data){
      console.log(data)
      const {index,mobile,id} = data
      let chats = await fs.promises.readFile(fname,"utf8")
        let data1 = JSON.parse(chats)
        let chatdata = data1.find((st)=>st.id===+id)
        let friend = chatdata.contact.find((st)=>st.mobile===+mobile)
        friend.message[index].download= true
        let data2=JSON.stringify(data1);
        await fs.promises.writeFile(fname,data2)
        let chatdata5 = data1.find((st)=>st.id===+id)
       let chatdata6 = chatdata5.contact.find((st)=>st.mobile===+mobile)
        io.to(chatdata.mobile).emit("receive-msg",{msgData:chatdata5,userData:chatdata6})
    })
    socket.on("disconnect",() =>{
      console.log("Discconect : ", socket.id)
     })
   
});
