import React, { useEffect, useState }  from 'react';
import { useNavigate } from 'react-router-dom';
import POSRules from '../POS/POSRules';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';

import styled from 'styled-components';
import { Button } from '@mui/material';
import axios from 'axios';
  
const colorData = {
  "NOUN": "#fad",
  "PROPN": "#87CEEB",
  "VERB": "#BA55D3",
  "ADJ": "red",
  "ADV": "#ACE95B",
  "ADP": "#D74222",
  "PRON": "#E256D5",
  "DET": "#FFA07A",
  "CONJ": "#92B050",
  "PART": "#19E4AE",
  "PRON_WH": "#8A12D3",
  "PART_NEG": "#2AA9BB",
  "NUM": "#C6DA2D",
  "X": "#6A4BD3",
};

const posTags = [
  "NOUN",
  "PROPN",
  "VERB",
  "ADJ",
  "ADV",
  "ADP",
  "PRON",
  "DET",
  "CONJ",
  "PART",
  "PRON_WH",
  "PART_NEG",
  "NUM",
  "X"
];
const FetchSent = async (id_prop) => {
  const id = JSON.parse(id_prop); // Assuming id_prop is already a JSON-parsed value
  const data = {
    pos_id: id, 
  };
  console.log("fetch Pos_id called id: ", id);
  try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-p-sentence`, data);
      // console.log("server return:", res.data.result);
      return res.data.result;
  } catch (error) {
      console.error('Error fetching sentence:', error);
      throw error; // Rethrow the error to handle it in the caller function
  }
};

const FetchSentence = async (id_prop) => {
  const id = JSON.parse(id_prop); 
  const logged_in_user = JSON.parse(sessionStorage.getItem('annote_username'));
  const data = {
      id, 
      logged_in_user
  };
  try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/pos-edit-sentence`, data);
      console.log("server return:", res.data.result);
      return res.data.result;
  } catch (error) {
      console.error('Error fetching sentence:', error);
      throw error;
  }
};

const POSEDIT =  props => {
    const { posid } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [data, setData] = useState([]);
    const [pos_id, setpos_Id] = useState(posid);
    const [compress, setCompress] = useState(false);
    const ignoreList = [',', '!', '.', '?'];
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    console.log(pos_id);

    useEffect(() => {
      const x = async () => {
          const dict = await FetchSent(posid);
          console.log(dict['sentence'])
          setText(dict['sentence']);
      };
      x();
  }, []);

    useEffect(() => {
      const x = async () => {
          const dict = await FetchSentence(posid);
          if (Array.isArray(dict.pos_tags) && Array.isArray(dict.pos_tags[2])) {
            const tmp = dict.pos_tags[2];
            let dataArr = [];
            tmp.forEach((element, index) => {
              let idx = dataArr.length - 1;
          
              if (idx >= 0 && element.word.includes('#')) {
                let newWord = dataArr[idx].word + element.word;
                newWord = newWord.replaceAll('#', '');
          
                let entity = element.entity;
          
                if (dataArr[idx].entity === tmp[index].entity) {
                  entity = dataArr[idx].entity;
                }
                dataArr.pop();
                dataArr.push({
                  'word': newWord,
                  'entity': entity
                });
              } else {
                dataArr.push({
                  'word': element.word,
                  'entity': element.entity
                });
              }
            });
          
            setData(dataArr);
            setCompress(true);
          } else {
            console.error("Unexpected data type in dict[0][2]");
          }
         
      };
      x();
  }, []);

    const startTime = new Date();

    // data.length > 0 && !compress && dataRefiner();

    const changePOS = (e, index) => {
      const updatedData = [...data];
      updatedData[index].entity = e.target.value;
      setData(updatedData);
    };

    const listItems = data.map(
        (element, index) => {
            return (
            (!ignoreList.includes(element.word) && <StyledFlexOption key={index} index={index} data={data}>
              <div style={{ color: "#fefefe" }}>{element.word}</div>
              <StyledSelect key={index} index={index} data={data} style={{maxHeight: '100%', overflow: 'auto'}} defaultValue={element.entity} onChange={e => changePOS(e, index)}>
                {posTags.map(pos => (
                    <StyledWord individualTag={pos} key={pos} value={pos}>
                      {pos}
                    </StyledWord> 
                  ))}
              </StyledSelect>
            </StyledFlexOption>)
            ) 
        }
    )

    const onSubmitHandler = async (e, data_) => {
      e.preventDefault();
      console.log('Submitted = ', data_)
      setFeedback('');
      setFeedbackVisible(false);
      const username = JSON.parse(sessionStorage.getItem('annote_username'));
      const date = new Date();
      const endTime = new Date();
      const pos_tag = data_;

      const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(timeDifference);

      const data = {
        pos_id,
        pos_tag,
        username,
        date,
        timeDifference,
        feedback,
    };
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-pos-edit-sentence`, {
          method: "POST",
          headers: {
              'Content-type': 'application-json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(data)
      });
      console.log("res",res);
      navigate('/profile1');
     
    };

  return (
    <div className="App">
      <Navbar />
      <POSRules />
      <StyledSentenceId>#{posid}</StyledSentenceId>
      <div className='textAreaBox'>
        <div className='textArea'>{text}</div>
      </div>

      <div className='generatedBox'>
        <h3>Individual POS Tag</h3>
        <StyledFlex>
          {data && listItems}
        </StyledFlex>
        <div>
                  
        <FeedbackLabel htmlFor="feedback" onClick={() => setFeedbackVisible(!feedbackVisible)}>
         Feedback:
        </FeedbackLabel>
        {feedbackVisible && (
        <textarea
        id="feedback"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Enter your feedback here"
        />
        )}
        </div>
        <StyledButton onClick={e => onSubmitHandler(e, data)}>Submit</StyledButton>
      </div>  
    </div>
  );
}

export default POSEDIT;

export const StyledButton = styled(Button)`
    background-color: #502380 !important;
    color: white !important;
    margin-top: 24px;
    font-weight: 500 !important; /* Medium bold */
`;

const StyledFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 90%;
    margin: 24px auto;
    flex-wrap: wrap;
`;

const StyledWord = styled.option`
    border-radius: 8px;
    padding: 8px 8px;
    text-align: center;
    color: white;
    background-color: ${props => colorData[props.individualTag]};
    cursor: pointer;
    display: flex;
    flex: 0 1 10%;
    min-width: 70px;
    justify-content: center;
`;

const StyledFlexOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
  background-color: ${props => colorData[props.data[props.index].entity]};
  padding: 10px;
  border-radius: 8px;
`;

const StyledSelect = styled.select`
  background-color: ${props => colorData[props.data[props.index].entity]};
  border: 0;
  color: #fefefe !important;
`;

const StyledSentenceId = styled.div`
    background-color: #efefef;
    border-radius: 12px;
    padding: 12px;
    position: fixed;
    top: 75px;
    right: 20px;
`;

const FeedbackLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
`;