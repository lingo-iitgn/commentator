import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';

const Profilematrix = () => {
    const history = useNavigate();
    const [rows, setRows] = useState([{
        id: 0, sentence: 'Dummy Sentence', grammar: 'e'
    }]);
    const [rangeStart, setRangeStart] = useState(1);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 100 },
        { field: 'sentence', headerName: "Sentence", flex: 1, renderCell: (params) => {
            const {row} = params;
            const sentence = row['sentence'];
            const grammarTag = row['grammar'];
            
            if(sentence !== 'Dummy Sentence'){
                return (<StyledSentence tokenTag={grammarTag}>
                    {sentence}
                </StyledSentence>); 
            } else {
                return ("Dummy Sentence");
            }
        }},
    ];

    const fetchAllSentences = async () => {
        const username = sessionStorage.getItem('annote_username');
        
        let startValue = rangeStart ? parseInt(rangeStart) : 1;
        if (page !== 0) {
            startValue = (page * 15) + 1;
        }
    
        const data = {
            username,
            start: startValue,
        };
    
        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-m-sentences`, {
                method: "POST",
                headers: {
                  "Content-type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify(data),
            });
    
            console.log("Response:", res);
            let result = res.data.result;
            console.log("result", result);
            
            let rowArr = [];
            let sid = startValue;
    
            const dateFormatter = (d) => {
                if (typeof d === 'string') {
                    return d.split('T')[0]; 
                }
                return d; 
            };
    
            result.forEach((elem) => {
                const tag = elem[0];     
                const sentence = elem[1]; 
                const date = elem[2];    
                
                const row = {
                    id: sid,
                    date: dateFormatter(date),
                    sentence: sentence,
                    grammar: tag, 
                };
        
                sid++;
                rowArr.push(row);
            });
    
            setRows(rowArr);
            setTotalCount(res.data.total_count || result.length); 
        } catch (error) {
            console.error("Error fetching sentences:", error);
            setRows([]);
        }
    };
    

    useEffect(() => {
        fetchAllSentences();
    }, [rangeStart]);

    const handleRangeChange = () => {
        fetchAllSentences();
    };

    return (
        <div>
            <Navbar />
            <div style={{ margin: '70px 70px 10px 70px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <input
                type="number"
                value={rangeStart}
                onChange={(e) => {
                const value = parseInt(e.target.value);
                setRangeStart(value < 1 ? 1 : value); 
                }}
                min="1"
                style={{ textAlign: 'center' }}
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
                        onRowClick={(param) => history(`/mat-edit/${param.row.id}`)}
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

export default Profilematrix;

const StyledDataGridContainer = styled.div`
    height: 80vh;
    width: 90%;
    /* padding: 24px; */
    margin: 32px auto;
    overflow-x: hidden;
    cursor: pointer;
`;

const StyledSentence = styled.div`
    border-radius: 8px;
    padding: 8px;
    text-align: center;
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    gap: 4px;
    font-size: 18px;
    overflow: hidden;
    background-color: #efefef;
    color: #333;
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