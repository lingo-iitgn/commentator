import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';

const Profile = () => {
    const history = useNavigate();
    const [rows, setRows] = useState([{
        id: 0, sentence: 'Dummy Sentence', grammar: 'e'
    }]);
    const [rangeStart, setRangeStart] = useState(1);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 110 },
        { field: 'sentence', headerName: "Sentence", flex: 1, renderCell: (params) => {
            const {row} = params;
            const tagArray = row['sentence'];
            if(tagArray !=='Dummy Sentence'){
                return (<StyledFlexer>
                    {tagArray && tagArray.map((elem, index) => {
                        return (
                            <StyledWord key={index} tokenTag={elem['value']}>{elem['key']}</StyledWord>
                        );
                    })}
                </StyledFlexer>); 
            } else {
                return ("Dummy Sentence");
            }
        }},
    ];

    const fetchAllSentences = async () => {
        const username = sessionStorage.getItem('annote_username');
        
        let startValue = rangeStart || 1;
        if (page !== 0) {
            startValue = (page * 15) + 1;
        }
        
        const data = {
            username,
            start: startValue,
        };

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-sentences`, {
                method: "POST",
                headers: {
                  "Content-type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(data),
            });

            let result = res.data.result;
            let rowArr = [];
            let sid = startValue;

            const dateFormatter = d => {
                return (
                    d.split('T')[0]
                );
            };

            result.forEach((elem) => {
                let sentence = "";
                elem[1].forEach(word => {sentence = sentence + word['key'] + " "})
                console.log(sentence);

                const row = {
                    id: sid,
                    date: dateFormatter(elem[0]),
                    sentence: elem[1],
                };
                sid++;
                console.log(row);
                rowArr.push(row);
            });
            
            setRows(rowArr);
            setTotalCount(res.data.total_count || result.length);
        } catch (error) {
            console.error("Error fetching sentences:", error);
        }
    };

    useEffect(() => {
        fetchAllSentences();
    }, [rangeStart, page]);

    const handleRangeChange = () => {
        if (rangeStart) {
            const newPage = Math.floor((rangeStart - 1) / 15);
            setPage(newPage);
        }
        fetchAllSentences();
    };

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
                    height: '38px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box'
                }}
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
                        rowCount={totalCount}
                        pagination
                        paginationMode="server"
                        page={page}
                        onPageChange={(newPage) => {
                            setPage(newPage);
                            setRangeStart((newPage * 15) + 1);
                        }}
                        rowsPerPageOptions={[15]}
                        onRowClick={(param) => history(`/edit/${param.row.id}`)}
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

export default Profile;

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
    padding: 8px 8px;
    text-align: center;

    display:flex;
    flex: 0 1 10%;
    justify-content: center;

    background-color: ${props => props.tokenTag === 'e' && '#bbdfc8'};
    background-color: ${props => props.tokenTag ==='h' && '#f3f2c9'};
    background-color: ${props => props.tokenTag === 'u' && '#D4DCE9'};
`;

const StyledFlexer = styled.div`
    display:flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    gap: 4px;
    overflow: hidden;
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

