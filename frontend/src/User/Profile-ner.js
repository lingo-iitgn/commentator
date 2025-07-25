import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';

const entityColorMap = {
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

const Profilener = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [rangeStart, setRangeStart] = useState(null); 
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchAllSentences = async () => {
        const username = sessionStorage.getItem('annote_username');
        const data = { username };

        let startValue = rangeStart ? parseInt(rangeStart) : 1;
        if (page !== 0) {
            startValue = (page * 15) + 1;
        }
        data.start = startValue;

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-ner-sentences`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(data),
            });

            let result = res.data.result;
            console.log("result", result);

          
            const rowArr = result.map((elem, index) => {
            if (!elem || !Array.isArray(elem) || !Array.isArray(elem[2])) {
                return {
                    id: index + (rangeStart || 1),
                    date: "",
                    sentence: "",
                    originalSentence: [],
                };
            }
            const sentence = elem[2].map(wordObj => wordObj.word).join(" ").trim();
            const wordsWithEntities = elem[2].map(wordObj => ({
                word: wordObj.word,
                entity: wordObj.entity
            }));
            const date = elem[0] ? elem[0].split('T')[0] : "";
            return {
                id: index + (rangeStart || 1),
                date: date,
                sentence: sentence,
                originalSentence: wordsWithEntities,
            };
        });

            setRows(rowArr);
            setTotalCount(res.data.total_count); // <-- set total count
        } catch (error) {
            console.error("Error fetching sentences:", error);
        }
    };

    const renderCell = (params) => {
        const { row } = params;
        const wordsWithEntities = row['originalSentence'];
        if (!Array.isArray(wordsWithEntities)) {
            return <div>{wordsWithEntities}</div>; 
        }

        const maxTokensToShow = 16;
        const tokensToDisplay = wordsWithEntities.slice(0, maxTokensToShow);

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {tokensToDisplay.map((wordObj, index) => {
                    const { word, entity } = wordObj;
                    return (
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

    const handleRangeChange = (e) => {
        const value = parseInt(e.target.value);
        setRangeStart(isNaN(value) || value < 1 ? null : value); 
    };

    return (
        <div>
            <Navbar />
            <div style={{ margin: '70px 70px 10px 70px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <input
                    type="number"
                    value={rangeStart ?? ""}
                    onChange={handleRangeChange}
                    min="1"
                    style={{ textAlign: 'center' }} 
                    placeholder="Start"
                />
                <button
                    onClick={() => {
                        if (rangeStart) {
                            const newPage = Math.floor((rangeStart - 1) / 15);
                            setPage(newPage);
                            setRangeStart(rangeStart); 
                        }
                        fetchAllSentences();
                    }}
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
                rowCount={totalCount}
                pagination
                paginationMode="server"
                page={page}
                onPageChange={(newPage) => {
                    setPage(newPage);
                    setRangeStart((newPage * 15) + 1);
                }}
                rowsPerPageOptions={[15]}
                onRowClick={(param) => navigate(`/ner-edit/${param.row.id}`)}
            />
                )}
                {rows.length === 0 && (
                    <StyledMessage>
                        Please start annotating sentences first, then you can proceed with annotations.
                    </StyledMessage>
                )}
            </StyledDataGridContainer>
        </div>
    );
};

export default Profilener;

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

const StyledMessage = styled.div`
    font-size: 20px;
    text-align: center;
    margin: 28px auto;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 10px;
    font-weight: bold;
    color: #333;
`;
