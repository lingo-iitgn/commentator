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

    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 100 },
        { field: 'sentence', headerName: "Sentence", flex: 1, renderCell: (params) => {
            const {row} = params;
            const tagArray = row['sentence'];
            if(tagArray !=='Dummy Sentence'){
                return (<StyledFlexer>
                    {tagArray && tagArray.map(elem => {
                        return (
                            <StyledWord tokenTag={elem['value']}>{elem['key']}</StyledWord>
                        );
                    })}
                </StyledFlexer>); 
            } else {
                return ("Dummy Sentence");
            }
        }},
        // { field: 'grammar', headerName: "Grammar", width: 100 },
    ];

    const fetchAllSentences = async () => {
        const username = sessionStorage.getItem('annote_username');
        const data = {
            username,
            start: rangeStart,
        };
        const res = axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-sentences`, {
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
        // console.log("result",result);

        let rowArr = [];
        let sid = rangeStart; 

        const dateFormtatter = d => {
            return (
                d.split('T')[0]
            );
        };

        result.map((elem) => {
            let sentence = "";
            //console.log(elem);
            elem[2].map(word => {sentence = sentence + word['key'] + " "})
            console.log(sentence);

            const row = {
                id: sid,
                date: dateFormtatter(elem[1]),
                sentence: elem[2],
                // grammar: elem[0]
            };
            sid++;
            console.log(row);
            rowArr.push(row);
        });
        setRows(rowArr);
    };

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
                {rows.length > 0 ? (
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={15}
                        rowsPerPageOptions={[15]}
                        onRowClick={(param) => history(`/edit/${param.row.id}`)}
                    />
                ) : (
                    <StyledMessage>Please start by annotating sentences first; then you can proceed with editing the annotations.
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
