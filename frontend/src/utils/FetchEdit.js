import axios from 'axios';

const FetchSentence = async (id_prop) => {
    const id = JSON.parse(id_prop); // Assuming id_prop is already a JSON-parsed value
    const data = {
        sentId: id, 
    };
    console.log("fetch sent called id: ", id);
    try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-sentence`, data);
        console.log("server return:", res.data.result);
        return res.data.result;
    } catch (error) {
        console.error('Error fetching sentence:', error);
        throw error; // Rethrow the error to handle it in the caller function
    }
};

export default FetchSentence;
