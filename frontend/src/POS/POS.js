import React, { useEffect, useState }  from 'react';
import './POS.css';
import Navbar from '../Components/Navbar';

import styled from 'styled-components';
import POSRules from './POSRules';

import { Button } from '@mui/material';

import axios from 'axios';


const convertToIST = (utcDate) => {
  return new Date(utcDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const getCurrentIST = () => {
  return convertToIST(new Date());
};

const formatISTDate = (istDate) => {
  const offset = istDate.getTimezoneOffset() * 60000;
  const localISOTime = new Date(istDate.getTime() - offset).toISOString().slice(0, -1);
  return localISOTime + '+05:30';
};

const formatDateTimeIST = (istDate) => {
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  
  let hours = istDate.getHours();
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');

  return `${year}-${month}-${day} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
};

const getDifferenceInSeconds = (date1, date2) => {
  const diffMs = date1.getTime() - date2.getTime(); 
  return Math.abs(Math.floor(diffMs / 1000)); 
};
  
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

const POS = () => {
    const [text, setText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [data, setData] = useState([]);
    const [dummy, setDummy] = useState(null);
    const [isDataEmpty, setIsDataEmpty] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [startTimeIST, setStartTimeIST] = useState(() => getCurrentIST());


  const fetchPOSSentence = async () => {
    const pos_id = JSON.parse(sessionStorage.getItem("pos_id"));
    const data = { pos_id };
  
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fetch-pos-sent`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log(res.data.result);
  
      if (res.data.result.length > 0) {
        setText(res.data.result[0][0]);
        let tmp = JSON.parse(res.data.result[0][1]);
        setData(tmp);
        setIsDataEmpty(false); 
      } else {
        setIsDataEmpty(true); 
      }
  
    } catch (error) {
      console.error("Error fetching POS sentence:", error);
    }
  };


  useEffect(() => {
    fetchPOSSentence();
    setStartTimeIST(getCurrentIST());  
  }, []);


    const changePOS = (e, index) => {
      console.log("Change: ", e.target.value, "Index: ", index)
      var tmp = data;
      tmp[index].entity = e.target.value
      console.log(tmp);
      setData(tmp);
      setDummy(Math.random());
    };

    const ignoreList = [',', '!', '.', '?']
    const [compress, setCompress] = useState(false);

    const dataRefiner = () => {
      let dataArr = [];
      data.map((element, index) => {
        let idx = dataArr.length - 1;
    
        if (idx >= 0 && element.word.includes('#')) {
          let newWord = dataArr[idx].word + element.word;
          newWord = newWord.replaceAll('#', '');
    
          let entity = element.entity; 
    
          if (dataArr[idx].entity === data[index].entity) {
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
    }
    
    
    data.length > 0 && !compress && dataRefiner();

    const listItems = data.map(
        (element,index) => {
            return (
            (!ignoreList.includes(element.word) && <StyledFlexOption key={index} index={index} data={data}>
              <div style={{ color: "#fefefe" }}>{element.word}</div>
              <StyledSelect key={index} index={index} data={data} style={{maxHeight: '100%', overflow: 'auto'}} defaultValue={element.entity} onChange={e => changePOS(e, index)}>
                {posTags.map(pos => {
                  
                  return(
                    <StyledWord individualTag={pos} key={pos} value={pos}>
                      {pos}
                    </StyledWord> 
                  );
                })}
              </StyledSelect>
            </StyledFlexOption>)
            ) 
        }
    )

    const onSubmitHandler = async (e, data_) => {
      e.preventDefault();
      console.log('Submitted = ', data_)
      setFeedbackVisible(false);

      const username = JSON.parse(sessionStorage.getItem('annote_username'));
      
      const endTimeIST = getCurrentIST();
      
      const pos_id = parseInt(sessionStorage.getItem('pos_id')) + 1;
      const pos_tag = data_;

      const timeDifference = getDifferenceInSeconds(endTimeIST, startTimeIST);

      console.log('Time difference (seconds):', timeDifference);
      console.log('Start time (IST):', formatDateTimeIST(startTimeIST));
      console.log('End time (IST):', formatDateTimeIST(endTimeIST));

      const data = {
        pos_id,
        pos_tag,
        username,
        date: formatDateTimeIST(endTimeIST), 
        startTime: formatDateTimeIST(startTimeIST), 
        endTime: formatDateTimeIST(endTimeIST), 
        fullTimestamp: formatISTDate(endTimeIST), 
        timeDifference,
        feedback,
        timezone: 'IST'
    };
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-pos-sentence`, {
          method: "POST",
          headers: {
              'Content-type': 'application-json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(data)
      });
      console.log(res);
      sessionStorage.setItem('pos_id', pos_id)
      window.location.reload()
    };

  return (
    <div className="App">
            <Navbar />
            <POSRules />
            {isDataEmpty ? (
                <div className='Box'>
                    You are done with all the sentences. Please ask the administrator to upload the next set of sentences.
                </div>
            ) : (
                <>
                    <StyledSentenceId>#{JSON.parse(sessionStorage.getItem("pos_id")) + 1}</StyledSentenceId>
                    <div className='textAreaBox'>
                        <div className='textArea'>{text}</div>
                    </div>

                    <div className='generatedBox'>
                        <h3>Individual POS Tags</h3>
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
                </>
            )}
        </div>
  );
}

export default POS;

export const StyledButton = styled(Button)`
    background-color: #502380 !important;
    /* width: 100% !important; */
    color: white !important;
    margin-top: 24px;
`;

const StyledFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 90%;
    margin: 15px auto;
    flex-wrap: wrap;
`;


const StyledWord = styled.option`
    border-radius: 8px;
    padding: 8px 8px;
    text-align: center;
    color: white;

    background-color: ${props => colorData[props.individualTag]};
    cursor: pointer;
    display:flex;
    flex: 0 1 10%;
    min-width: 70px;
    justify-content: center;
    color: #fefefe !important;
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