import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Avatar from './Avatar';
import Logo from './Logo';
import { uniqBy } from 'lodash';
import { UserContext } from './UserContext.jsx';
import { useContext } from 'react';
import { useRef } from 'react';
import axios from 'axios';
import Contact from './Contact.jsx';
const connectionObject ={

    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
}
const socket = io.connect('http://localhost:3000',connectionObject);
export default function Chat()
{
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username,id, setId, setUsername} = useContext(UserContext);
    const [newMessagetText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const divUnderMessages = useRef();
    const [offlinePeople, setOfflinePeople] = useState({});
    const fileInputRef = useRef();

    socket.on('ping', () => {
        
        socket.emit('pong');

    });


    useEffect(() => {

        socket.addEventListener('message',handleMessage);
        
       


    },[]);

    function showOnlinePeople(peopleArray)
    {
        // console.log(people);

       const people = {};

       peopleArray.forEach(({id,username}) => {

              people[id] = username;

       });

    //    console.log(people);
    //    console.log(peopleArray);

    setOnlinePeople(people);

    }

   

    function handleMessage(ev)
    {
        const messageData = JSON.parse(ev);
        console.log({ev, messageData});
        if('online' in messageData)
        {
            showOnlinePeople(messageData.online);
        }
        else if('text' in messageData)
        {
            if(messageData.sender === selectedUserId)
            console.log(messageData);
            setMessages(prev => ([...prev, {...messageData}]));
        }
      
    }

    function logout()
    {
        axios.post('/logout').then(() => {

            setId(null);
            setUsername(null);
        

        });
    }

    function sendMessage(ev, file = null)
    {
        if(ev) ev.preventDefault();
        
        socket.emit('message',JSON.stringify({

           
                recipient: selectedUserId,
                text: newMessagetText,
                file,

            

        }));

        if(file)
        {
            axios.get('/messages/' + selectedUserId).then(res => {

                setMessages(res.data);
            });
        }
        else
        {
        setNewMessageText('');
        
        setMessages(prev => ([...prev, {
            text: newMessagetText, 
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
    }
        
        fileInputRef.current.value = '';
        

        
        // const div = divUnderMessages.current;
        // div.scrollIntoView({behavior: 'smooth', block: 'end'});
        // div.scrollTop = div.scrollHeightFull;

       
    }

    function sendFile(ev)
    {
        const reader = new FileReader();
        
        console.log(ev.target.files);
        reader.readAsDataURL(ev.target.files[0]);
        const file = ev.target.files[0];

        reader.onload = () => {

            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,

            })

        }
    };

    useEffect(() => {

        const div = divUnderMessages.current;
        if(div)
        {
        div.scrollIntoView({behavior: 'smooth', block: 'end'});
        }
    }, [messages]);

    useEffect(() => {
        
        axios.get('/people').then(res => {


            const offlinePeopleArr = res.data.filter(p => p._id !== id).filter(p => !Object.keys(onlinePeople).includes(p._id));
            
            const offlinePeople = {};

            offlinePeopleArr.forEach(p => {
                
                    offlinePeople[p._id] = p;
    
                });

            console.log({offlinePeople, offlinePeopleArr});
            setOfflinePeople(offlinePeople);

        })

    }, [onlinePeople]);

    useEffect(() => {

        if(selectedUserId)
        {
            axios.get('/messages/' + selectedUserId).then(res => {
                console.log(res.data);
                setMessages(res.data);

            })
        }


    },[selectedUserId]);

    const onlinePeopleExcludingOurUser = {...onlinePeople};
    delete onlinePeopleExcludingOurUser[id];

    const messageWithoutDupes = uniqBy(messages, '_id');

    return (

        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
                {/* <div className='text-blue-600 font-bold flex gap-2 p-4'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z" clipRule="evenodd" />
                </svg>
                    EternityChat
                </div> */}

            <div className='flex-grow'>
                <Logo/>
                
                
                {Object.keys(onlinePeopleExcludingOurUser).map(id => (

                    // <div key={id} onClick={() => setSelectedUserId(id)} 
                    // className={'border-b border-gray-100  flex items-center gap-2 cursor-pointer ' + (id === selectedUserId? 'bg-blue-50' : '')}>
                    //     {id === selectedUserId && (

                    //         <div className='w-1 bg-blue-500 h-12 rounded-r-md'></div>

                    //     )}

                    //     <div className='flex gap-2 py-2 pl-4 items-center'>
                    //         <Avatar online={true} username={onlinePeople[id]} userId={id}/>
                    //     <span className='text-gray-800'>{onlinePeople[id]}</span>
                    //     </div>
                       
                    // </div>

                    <Contact id={id} 
                    key={id}
                    username={onlinePeopleExcludingOurUser[id]} 
                    onClick={() => setSelectedUserId(id)}
                    selected={id === selectedUserId}
                    online={true} />

                ))}

                {Object.keys(offlinePeople).map(id => (

                    // <div key={id} onClick={() => setSelectedUserId(id)} 
                    // className={'border-b border-gray-100  flex items-center gap-2 cursor-pointer ' + (id === selectedUserId? 'bg-blue-50' : '')}>
                    //     {id === selectedUserId && (

                    //         <div className='w-1 bg-blue-500 h-12 rounded-r-md'></div>

                    //     )}

                    //     <div className='flex gap-2 py-2 pl-4 items-center'>
                    //         <Avatar online={true} username={onlinePeople[id]} userId={id}/>
                    //     <span className='text-gray-800'>{onlinePeople[id]}</span>
                    //     </div>
                       
                    // </div>
                    
                    <Contact id={id} 
                    key={id}
                    username={offlinePeople[id].username} 
                    onClick={() => setSelectedUserId(id)}
                    selected={id === selectedUserId}
                    online={false} />

                ))}
                </div>

                <div className='p-2 text-center flex items-center flex-col gap-2 justify-center'>
                    <span className='mr-2 items-center flex flex-col text-sm text-gray-600'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>

                         {username}
                        
                    </span>
                    <button onClick={logout} className='text-sm text-white bg-blue-600 p-4 rounded-full w-40'>logout</button>
                    
                    </div>


            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className='flex items-center justify-center h-full'>
                            <div className='text-gray-400'>&larr; select a person</div>
                            </div>
                    )}
                    {!!selectedUserId && (
                        
                      

                        <div className='relative h-full'>
                              <div  className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
                            {messageWithoutDupes.map(message => (
                                <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>

                                <div className={'text-left inline-block p-2 my-2 rounded-md text-sm ' + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                   
                                    {message.text}
                                    {message.file && (
                                        <div>
                                           
                                            <a target="_blank" className='border-b flex items-center gap-1' href={axios.defaults.baseURL + 'uploads/' + message.file}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                 <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
                                                </svg> {message.file}
                                            </a>
                                        </div>
                                    )}
                                    </div>
                                    </div>

                            ))}
                            <div ref={divUnderMessages}></div>
                        </div>
                        </div>
                      

                    )}
                </div>
                {!!selectedUserId && (
                    
                     <form className="flex gap-2" onSubmit={sendMessage}>
                    <input type="text" 
                            value={newMessagetText}
                            onChange={ev => setNewMessageText(ev.target.value)}
                           className="bg-white border flex-grow p-2 rounded-md" 
                           placeholder="Type your message here"/>
                          
                        <label className='bg-blue-200 p-2 cursor-pointer text-gray-500 rounded-sm border border-blue-200'>

                            <input ref={fileInputRef} type="file" className='hidden' onChange={sendFile}/>

                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
                        </svg>


                        </label>

                        <button type='submit' className="bg-blue-500 p-2 text-white rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>

                        </button>
                </form>

                )}
               
            </div>
        </div>

    )
}