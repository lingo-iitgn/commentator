import React, { useEffect, useState }  from 'react';
import './NER.css';
import Navbar from '../Components/Navbar';

import styled from 'styled-components';
import POSRules from './NERRules';

import { Button } from '@mui/material';

import axios from 'axios';

const colorData = {
    "PERSON": "#FFD700",  
    "ORGANISATION": "#DC143C",     
    "PLACE": "#FF69B4",  
    "DATE": "#32CD32",
    "TIME": "#FF8C00",
    "GPE": "#8B4513",    
    "HASHTAG": "#708090",
    "MENTION": "#9ACD32",
    "EMOJI": "#FF4500",
    "X": "#6495ED",
};

const nerTags = [
    "PERSON",   
    "ORGANISATION",      
    "PLACE",
    "DATE",
    "TIME",
    "GPE",
    "HASHTAG",
    "MENTION",
    "EMOJI",
    "X",
];

const refineNERData = (data) => {
    const tagMapping = {
        "B-PERSON": "PERSON",
        "I-PERSON": "PERSON",
        "B-ORGANISATION": "ORGANISATION",
        "I-ORGANISATION": "ORGANISATION",
        "B-PLACE": "PLACE",
        "I-PLACE": "PLACE",
        // Add other mappings as needed
    };

    const isHashtag = (word) => /^#\w+/.test(word);
    const isMention = (word) => /^@\w+/.test(word);
    const isDate = (word) => /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2}|\d{4})\b/.test(word);
    const isTime = (word) => /\b\d{1,2}:\d{2}(?:AM|PM|am|pm)?\b/.test(word);
    const isEmoji = (word) => /^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F004}\u{1F0CF}]+)$/u.test(word);

    let refinedData = [];
    data.forEach((element) => {
        let entity = tagMapping[element.entity] || element.entity;

        // Apply additional logic if the entity is missing or marked as "X"
        if (!entity || entity === 'X') {
            if (isHashtag(element.word)) {
                entity = 'HASHTAG';
            } else if (isMention(element.word)) {
                entity = 'MENTION';
            } else if (isDate(element.word)) {
                entity = 'DATE';
            } else if (isTime(element.word)) {
                entity = 'TIME';
            } else if (isEmoji(element.word)) {
                entity = 'EMOJI';
            } else {
                entity = 'X';
            }
        }

        refinedData.push({
            word: element.word,
            entity: entity
        });
    });
    return refinedData;
};

const NER = () => {
    const [text, setText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [data, setData] = useState([]);
    const [dummy, setDummy] = useState(null);
    const [isDataEmpty, setIsDataEmpty] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);

    const fetchNERSentence = async () => {
        const ner_id = JSON.parse(sessionStorage.getItem("ner_id")) ;
        const data = { 
            ner_id,
         };
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fetch-ner-sent`, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        console.log(res.data.result);


        if (res.data.result.length > 0) {
            setText(res.data.result[0][0]);

            const rawNERTags = JSON.parse(res.data.result[0][1]);
            console.log("Raw NER tags:", rawNERTags);

            const refinedTags = refineNERData(rawNERTags);
            console.log("Refined NER tags:", refinedTags);

            setData(refinedTags); 
            setIsDataEmpty(false);
        } else {
            setIsDataEmpty(true);
        }
    };

    useEffect(() => {
        fetchNERSentence();
    }, []);

    const startTime = new Date();

    const changeNER = (e, index) => {
        console.log("Change: ", e.target.value, "Index: ", index);
        var tmp = [...data]; 
        tmp[index].entity = e.target.value;
        setData(tmp);
        setDummy(Math.random()); 
    };

    const ignoreList = [',', '!', '.', '?'];

    const [compress, setCompress] = useState(false);

    const dataRefiner = () => {
        let dataArr = [];
        data.forEach((element, index) => {
            let idx = dataArr.length - 1;
    
            if (idx >= 0 && element.word.startsWith('##')) {
                let newWord = dataArr[idx].word + element.word.replace('##', '');
                let entity = dataArr[idx].entity; 
    
                dataArr.push({ 'word': newWord, 'entity': entity });
            } else {
                dataArr.push({ 'word': element.word, 'entity': element.entity });
            }
        });
    
        setData(dataArr);
        setCompress(true);
    };

    
    
    useEffect(() => {
        if (data.length > 0 && !compress) {
            dataRefiner();
        }
    }, [data, compress]);

    const listItems = data.map((element, index) => {
        return (
            !ignoreList.includes(element.word) && (
                <StyledFlexOption key={index} index={index} data={data}>
                    <div style={{ color: "#fefefe" }}>{element.word}</div>
                    <StyledSelect 
                        key={index} 
                        index={index} 
                        data={data} 
                        style={{ maxHeight: '100%', overflow: 'auto' }} 
                        defaultValue={element.entity} 
                        onChange={e => changeNER(e, index)}
                    >
                        {nerTags.map(ner => (
                            <StyledWord individualTag={ner} key={ner} value={ner}>
                                {ner}
                            </StyledWord>
                        ))}
                    </StyledSelect>
                </StyledFlexOption>
            )
        );
    });

    const onSubmitHandler = async (e, data_) => {
      e.preventDefault();
      console.log('Submitted = ', data_)
      setFeedbackVisible(false);

      const username = JSON.parse(sessionStorage.getItem('annote_username'));
      const date = new Date();
      const endTime = new Date();

      const ner_id = parseInt(sessionStorage.getItem('ner_id'))+1;
      const ner_tag = data_;

      const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(timeDifference);

      const data = {
        ner_id,
        ner_tag,
        username,
        date,
        timeDifference,
        feedback,
    };
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-ner-sentence`, {
          method: "POST",
          headers: {
              'Content-type': 'application-json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(data)
      });
      console.log(res);
      sessionStorage.setItem('ner_id', ner_id)
      window.location.reload()
    };


  return (
    <div className="App">
            <Navbar />
            {/* <Leftbox /> */}
            <POSRules />
            {isDataEmpty ? (
                <div className='Box'>
                    You are done with all the sentences. Please ask the administrator to upload the next set of sentences.
                </div>
            ) : (
                <>
                    <StyledSentenceId>#{JSON.parse(sessionStorage.getItem("ner_id")) + 1}</StyledSentenceId>
                    <div className='textAreaBox'>
                        <div className='textArea'>{text}</div>
                    </div>

                    <div className='generatedBox'>
                        <h3>Individual NER Tag</h3>
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

export default NER;

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
