import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';

const Profilescn = () => {
    const history = useNavigate();
    const [rows, setRows] = useState([{ id: 0, sentence: 'Dummy Sentence' }]);
    const [rangeStart, setRangeStart] = useState(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const columns = [
        { field: 'id', headerName: "Sentence ID", width: 100 },
        { field: 'date', headerName: "Date", width: 100 },
        {
            field: 'sentence',
            headerName: 'Sentence',
            width: 1300,
            renderCell: (params) => (
                <StyledSentence>
                    {params.row.sentence}
                </StyledSentence>
            ),
        },
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
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/all-scn-sentences`, {
                body: JSON.stringify({
                  username,
                  start: startValue,
                }),
              });
              
            let result = res.data.result;
            setTotalCount(res.data.total_count || result.length);
            console.log("result", result);

    
            const dateFormatter = d => {
                try {
                  if (!d) return '';
              
                  if (!d.includes('/')) {
                    return new Date(d).toISOString().split('T')[0];
                  }
              
                  const [datePart] = d.split(',');
                  const [dd, mm, yyyy] = datePart.split('/');
                  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
              
                } catch {
                  return '';
                }
              };
              

            let sid = startValue;
            let rowArr = result.map(elem => {
                return {
                    id: sid++,
                    date: dateFormatter(elem[2]),
                    sentence: elem[1],
                };
            });

            setRows(rowArr);
        } catch (error) {
            console.error("Error fetching SCN sentences:", error);
            setRows([]);
            setTotalCount(0);
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
            <div style={{ margin: '70px 70px 10px 70px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <input
                    type="number"
                    value={rangeStart ?? ""}
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setRangeStart(isNaN(value) || value < 1 ? null : value);
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
                        onRowClick={(param) => history(`/scn-edit/${param.row.id}`)}
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

export default Profilescn;

const StyledDataGridContainer = styled.div`
    height: 80vh;
    width: 90%;
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