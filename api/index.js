const express = require('express');
const mongoose = require('mongoose');
const dotenv  = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
mongoose.connect(process.env.MONGO_URL); //change the url to the server's URLs
const User = require('./models/user');
const Message = require('./models/Message');
const jwtSecret = process.env.JWT_SECRET;
const cors = require('cors');
const cookieparser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');



const app = express();
const server = http.createServer(app);


app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json());
app.use(cookieparser());
app.use(cors({

    credentials: true,
    origin: process.env.CLIENT_URL,

}));

app.get('/', (req, res) => {

    res.json('test ok');

});

async function getUserDataFromRequest(req)
{
    return new Promise((resolve, reject) => {
    const token = req.cookies?.token;

    if(token)
    {
        jwt.verify(token, jwtSecret, {}, (err, userdata) => {

        if(err) throw err;

        resolve(userdata);
    });
    }
    else
    {
        reject('no token');
    }

});
}

app.get('/messages/:userId', async (req, res) => {

    const {userId} = req.params;

    const userData = await getUserDataFromRequest(req);

    const ourUserId = userData.userId;

    const messages = await Message.find({
        
        sender:{$in: [userId, ourUserId]},
        recipient: {$in: [userId, ourUserId]}
    
    
    }).sort({createdAt: 1});

    res.json(messages);



});

app.get('/people', async (req, res) => {

    const users =  await User.find({}, {'_id':1, username:1});
    res.json(users);


});

app.get('/profile', (req, res) => {

    const token = req.cookies?.token;

    if(token)
    {
        jwt.verify(token, jwtSecret, {}, (err, userdata) => {

        if(err) throw err;

        const {id, username} = userdata;

        res.json(userdata); });
    }
    else
    {
        res.status(401).json('no token');
    }
    

   

});

app.post('/login', async (req, res) => {

    const {username, password} = req.body;

    const foundUser = await User.findOne({username});

    if(foundUser)
    {
        const passOk = password === foundUser.password;

        if(passOk)
        {
            jwt.sign({userId:foundUser._id, username}, jwtSecret,{},(err, token) => {

                if(err)
                {
                    throw err;
                }
        
                res.cookie('token',token, {sameSite:'none', secure:true}).status(200).json({
        
                    id: foundUser._id,
                });
        
            });  
        }
    }


});

app.post('/logout', (req, res) => {

    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');

});

app.post('/register', async (req, res) => {
    const {username,password} = req.body;

    try
    {

    
    const createdUser = await User.create({username, password});
   jwt.sign({userId:createdUser._id, username}, jwtSecret,{},(err, token) => {

        if(err)
        {
            throw err;
        }

        res.cookie('token',token, {sameSite:'none', secure:true}).status(201).json({

            id: createdUser._id,
        });

    });  
    }
    catch(err)
    {
        if(err)
        {
        throw err
        }

        res.status(500).json('error');
    }
   
    
});

const io = new Server(server, {

   
    maxHttpBufferSize: 1e8,
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }

});

io.on('connection', profile => {

    function notifyAboutOnlinePeople()
    {
        [...io.sockets.sockets.values()].forEach(client => {

            client.send(JSON.stringify({
    
               online: [...io.sockets.sockets.values()].map(c => ({username: c.username, id: c.userId}))
    
        }));
    
        });
    }

    profile.isAlive = true;

  

    profile.timer = setInterval(() => {
         profile.emit('ping');

    profile.deathTimer = setTimeout(() => {
        if(profile.isAlive === false)
        {
            clearInterval(profile.timer);
            profile.disconnect();
            notifyAboutOnlinePeople();
            // console.log('dead');
            return;
        }
        

        profile.isAlive = false;} , 1000);
        

    }, 5000);

    profile.on('pong', () => {

        profile.isAlive = true;
            clearTimeout(profile.deathTimer);

        });

    
    // profile.timer = setInterval(() => {profile.on('ping', () => {
       
    //     profile.emit('ping', () => {});

    //     profile.deathTimer = setTimeout(() => {

    //         profile.isAlive = false;
    //         profile.disconnect();
    //         console.log('dead');

    //     },1000);


    // });}, 5000);

    // profile.on('pong', () => {

    //     clearTimeout(profile.deathTimer);
        

    // });
    
    // read username and id form the cookie for this connection
    const cookies = profile.handshake.headers.cookie;

    if(cookies)
    {
    const tokencookiestring = cookies.split(';').find(str => str.startsWith('token='));
    if(tokencookiestring)
    {
        const token = tokencookiestring.split('=')[1];
        if(token)
        {
            // console.log(token);
            jwt.verify(token, jwtSecret, {}, (err, userData) => {

                if(err) throw err;
                // console.log(userData);
                const {userId, username} = userData;
                profile.userId = userId;
                profile.username = username;

            });
        }
    }
    }

    profile.on('message', async (message) => {

        const messageData = JSON.parse(message.toString());
        // console.log(messageData);
        
        const {recipient, text, file} = messageData;
            let filename = null;
            if(file)
            {
                const parts = file.name.split('.');
                const ext = parts[parts.length - 1];

                filename = Date.now() + '.' +ext;
                const path = __dirname + '/uploads/' + filename;
                const data = file.data.split(',')[1];
                const bufferData = new Buffer.from(data, 'base64');
                // const bufferData = (file.data).toString('base64');
                console.log(bufferData);
                fs.writeFile(path,  bufferData, 'utf-8' , () => {

                    console.log('file saved:' + path);
                

                });
            }
        

        // console.log(recipient, text);

        if(recipient && (text || file))
        {
            const messageDocument = await Message.create({

                sender: profile.userId,
                recipient,
                text,
                file: file ? filename : null,
                
            });

            console.log("created message");
            // [...io.sockets.sockets.values()].forEach(c => {
                
            //     if(c.userId === recipient)
            //     {    
            //     console.log(c.userId);
            //     }
            
            // });
            
            [...io.sockets.sockets.values()].forEach(c => {
                
                
                if(c.userId === recipient)
                {
                    
                    c.send(JSON.stringify({text, sender: profile.userId,file: file? filename:null ,recipient, _id: messageDocument._id}));
                }
                
                // c.send(JSON.stringify({text}))
            });
        }


    });





    // console.log(cookies);
    // console.log([...io.sockets.sockets.values()].map(c => c.username));
    //notify everyone about the online poeple (when someone connects)
    // [...io.sockets.sockets.values()].forEach(client => {

    //     client.send(JSON.stringify({

    //        online: [...io.sockets.sockets.values()].map(c => ({username: c.username, id: c.userId}))

    // }));

    // });

    if(profile.isAlive)
    {
    notifyAboutOnlinePeople();
    }
});




server.listen(3000);



//9lYcnKQywiKS4n6H



