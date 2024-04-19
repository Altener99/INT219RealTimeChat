import { UserContextProvider } from "./UserContext";
import axios from "axios";
import Routes from "./Routes";

function App() {
//change the baseURL to the server's URL with a slash at the end
  axios.defaults.baseURL = 'http://localhost:3000/';
  axios.defaults.withCredentials = true;
  
  
  return (
    <UserContextProvider>
    <Routes />
    </UserContextProvider>
    )
}

export default App