import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';

const entityColorMap = {
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

const Profile1 = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([{
        id: 0, sentence: 'Dummy Sentence', grammar: 'e'
    }]);
    const [rangeStart, setRangeStart] = useState(1);

    const fetchAllSentences = async () => {
        const username = sessionStorage.getItem('annote_username');
        console.log("username", username)
        const data = {
            username,
            start: rangeStart,
        };
        const res = axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-pos-sentences`, {
            method: "POST",
            headers: {
              "Content-type": "application-json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(data),
        });

        //console.log(await res);
        let result = await res;
        result = result.data.result;
        console.log("result",result);

        const dateFormatter = (d) => {
            return d.split('T')[0];
        };
        const rowArr = result.map((elem, index) => {
            const sentence = elem[2].map(wordObj => wordObj.word).join(" ").trim();
            const wordsWithEntities = elem[2].map(wordObj => ({
                word: wordObj.word,
                entity: wordObj.entity
            }));
            const date = dateFormatter(elem[0]);
            const sentenceId = index + rangeStart;
            return {
                id: sentenceId,
                date: date,
                sentence: sentence, 
                originalSentence: wordsWithEntities, 
            };
        });
        
        setRows(rowArr);        
    };

    const renderCell = (params) => {
        const { row } = params;
        const wordsWithEntities = row['originalSentence'];
        if (!Array.isArray(wordsWithEntities)) {
            return <div>{wordsWithEntities}</div>; 
        }
    
        const maxTokensToShow = 16; // Maximum number of tokens to display
        const tokensToDisplay = wordsWithEntities.slice(0, maxTokensToShow);
    
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {tokensToDisplay.map((wordObj, index) => {
                    const { word, entity } = wordObj;
                    return (
                        // <span key={index} style={{ color: entityColorMap[entity] }}>{word} </span>
                        <StyledWord key={index} tokenTag={entity}>{word}</StyledWord>
                    );
                })}
                {wordsWithEntities.length > maxTokensToShow && <span>...</span>}
            </div>
        );
    };
    
    
    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 100 },
        { field: 'sentence', headerName: "Sentence", flex: 1, renderCell: renderCell },
    ];
    useEffect(() => {
        fetchAllSentences();
    }, [rangeStart]);

    const handleRangeChange = () => {
        fetchAllSentences();
    };

    // useEffect(() => {
    //     console.log(rows);
    // }, [rows]);

    return (
        <div>
            <Navbar />
            <div style={{ margin: '70px 70px 10px 70px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <input
                type="number"
                value={rangeStart}
                onChange={(e) => {
                const value = parseInt(e.target.value);
                setRangeStart(value < 1 ? 1 : value); // Handle potential invalid input
                }}
                min="1"
                style={{ textAlign: 'center' }} // Center align the input value
                placeholder="Start"
            />
            <button 
                onClick={handleRangeChange} 
                style={{
                    backgroundColor: '#FFD700',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                }}
            >
                Load Sentences
            </button>
            </div>
            <StyledDataGridContainer>
                {rows.length > 0 && (
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={15}
                        rowsPerPageOptions={[15]}
                        onRowClick={(param) => navigate(`/edit1/${param.row.id}`)}
                    />
                )}
            </StyledDataGridContainer>
        </div>
    );
};

export default Profile1;

const StyledDataGridContainer = styled.div`
    height: 80vh;
    width: 90%;
    /* padding: 24px; */
    margin: 32px auto;
    overflow-x: hidden;
    cursor: pointer;
`;

const StyledWord = styled.div`
    border-radius: 8px;
    padding: 5px 10px;  
    margin: 2px;       
    text-align: center;
    color: #fefefe !important;
    font-weight: 500;
    background-color: ${props => entityColorMap[props.tokenTag]};
    white-space: nowrap; /* Prevent line breaks */
    overflow: hidden; /* Hide overflowing content */
    text-overflow: ellipsis; /* Show ellipsis (...) for overflowed text */

`;

const StyledFlexer = styled.div`
    display:flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    gap: 4px;
    overflow: hidden;
`;