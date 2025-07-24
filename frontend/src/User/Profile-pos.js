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

const PAGE_SIZE = 15;

const Profilepos = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [rangeStart, setRangeStart] = useState(1); // 1-based index
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0); // 0-based page index
    const [filterValue, setFilterValue] = useState("");

    const fetchAllSentences = async (start = rangeStart, filter = filterValue) => {
        const username = sessionStorage.getItem('annote_username');
        const data = { username, start, filter };
        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-pos-sentences`, {
                method: "POST",
                headers: {
                  "Content-type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(data),
            });
            let result = res.data.result;
            setTotalCount(res.data.total_count || 0);

            const rowArr = result.map((elem, index) => {
                // Defensive: handle missing fields gracefully
                const wordsWithEntities = Array.isArray(elem[2]) ? elem[2].map(wordObj => ({
                    word: wordObj.word,
                    entity: wordObj.entity
                })) : [];
                const sentence = Array.isArray(elem[2]) ? elem[2].map(wordObj => wordObj.word).join(" ").trim() : "";
                const date = elem[0] ? elem[0].split('T')[0] : "";
                return {
                    id: index + start,
                    date: date,
                    sentence: sentence,
                    originalSentence: wordsWithEntities,
                };
            });
            setRows(rowArr);
        } catch (error) {
            console.error("Error fetching sentences:", error);
        }
    };

    useEffect(() => {
        fetchAllSentences(rangeStart);
    }, [rangeStart]);

    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 100 },
        { 
            field: 'sentence', 
            headerName: "Sentence", 
            flex: 1, 
            renderCell: (params) => {
                const wordsWithEntities = params.row.originalSentence;
                if (!Array.isArray(wordsWithEntities)) return <div>{params.row.sentence}</div>;
                const maxTokensToShow = 16;
                const tokensToDisplay = wordsWithEntities.slice(0, maxTokensToShow);
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {tokensToDisplay.map((wordObj, idx) => (
                            <StyledWord key={idx} tokenTag={wordObj.entity}>{wordObj.word}</StyledWord>
                        ))}
                        {wordsWithEntities.length > maxTokensToShow && <span>...</span>}
                    </div>
                );
            }
        }
    ];

    return (
        <div>
            <Navbar />
            <div style={{ margin: '70px 70px 10px 70px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
        <input
            type="number"
            value={rangeStart === null || rangeStart === undefined ? "" : rangeStart}
            onChange={e => {
                const value = e.target.value;
                if (value === "" || value === null) {
                    setRangeStart(""); // allow blank
                } else {
                    const num = parseInt(value, 10);
                    setRangeStart(isNaN(num) ? "" : num);
                }
            }}
            min="1"
            style={{
                textAlign: 'center',
                height: '44px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                boxSizing: 'border-box'
            }}
            placeholder="Start"
        />
        <button
            onClick={() => {
                if (rangeStart) {
                    const newPage = Math.floor((rangeStart - 1) / PAGE_SIZE);
                    setPage(newPage);
                    setRangeStart(rangeStart);
                    fetchAllSentences(rangeStart);
                }
            }}
            style={{
                backgroundColor: '#FFD700',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                height: '44px' // Explicitly set height for perfect alignment
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
                        pageSize={PAGE_SIZE}
                        rowCount={totalCount}
                        pagination
                        paginationMode="server"
                        page={page}
                        onPageChange={(newPage) => {
                            setPage(newPage);
                            setRangeStart((newPage * PAGE_SIZE) + 1);
                            fetchAllSentences((newPage * PAGE_SIZE) + 1);
                        }}
                        rowsPerPageOptions={[PAGE_SIZE]}
                        onRowClick={(param) => navigate(`/edit1/${param.row.id}`)}
                        hideFooterSelectedRowCount
                        onFilterModelChange={(model) => {
                            const val = model.items?.[0]?.value || "";
                            setFilterValue(val);
                            fetchAllSentences(rangeStart, val);
                        }}
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

export default Profilepos;

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