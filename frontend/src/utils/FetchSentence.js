import axios from 'axios';

const FetchSentence = async () => {
    const sentId =  JSON.parse(sessionStorage.getItem('sentId'));
    console.log("fetch sentence called:  id: ", sentId);
    
    const data = { sentId,
     };

    try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-sentence`, data, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        console.log("server return:", res.data.result);
        return res.data.result;
    } catch (error) {
        console.error('Error fetching sentence:', error);
        throw error; // Rethrow the error to handle it in the caller function
    }
};

export default FetchSentence;



// const FetchSentence = () => {
//     const [tag, setTag] = useState([]);


//     useEffect(() => {
//         const fetchData = async () => {
//             const sentId = JSON.parse(sessionStorage.getItem('sentId')) + 1;
//             console.log("fetch sentence called:  id: ", sentId);
            
//             const data = { sentId };

//             try {
//                 const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-sentence`, data, {
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                 });
//                 console.log("server return:", res.data.result);

//                 // Logic to set the tag
//                 const lst = res.data.result.map((elem, index) => ({
//                     key: elem[0],
//                     value: elem[1],
//                     index: index,
//                 }));
//                 setTag(lst);
//             } catch (error) {
//                 console.error('Error fetching sentence:', error);
//                 // Handle error if necessary
//             }
//         };

//         fetchData();
//     }, []); // Empty dependency array ensures that this effect runs only once, equivalent to componentDidMount

//     return null; // Assuming this component doesn't render anything visible
// };
// export const fetchData = async (sentId) => {
//     const data = { sentId };

//     try {
//         const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-sentence`, data, {
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//         console.log("server return:", res.data.result);
//         return res.data.result;
//     } catch (error) {
//         console.error('Error fetching sentence:', error);
//         throw error; // Rethrow the error to handle it in the caller function
//     }
// };  
// export default FetchSentence;
