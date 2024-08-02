import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Components
import Navbar from '../Components/Navbar';

const Admin = () => {
    const [file, setFile] = useState();
    const [userList, setUserList] = useState([]);
    const [fileType, setFileType] = useState('pos');
    const [cmi, setCmi] = useState(0);
    const [kappa, setKappa] = useState(0); // Define setKappa here

    useEffect(() => {
        const fetchUsernames = async () => {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fetch-users-list`, {
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
            setUserList(res.data.result);
        };

        fetchUsernames();
    }, []);

    const handleDownload = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('file_type', fileType);

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/csv-download`, formData, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${formData.get('username')}_${fileType}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading CSV files:", error);
        }
    };

    const adminFileUpload = process.env.REACT_APP_BACKEND_URL + '/admin-file-upload';
    const compareAnnotators = process.env.REACT_APP_BACKEND_URL + '/compare-annotators';

    return (
        <div>
            <Navbar />
            <StyledFlexContainer>
                <form method="POST" action={adminFileUpload} encType="multipart/form-data">
                    <input type='file' name="file" onChange={e => setFile(e.target.files[0])} />
                    <StyledButton type="submit">Submit</StyledButton>
                </form>

                <StyledForm method="POST" encType="multipart/form-data" onSubmit={handleDownload}>
                    <StyledTextInput as="select" name="username" placeholder='Enter username'>
                        <option value="ALL" name="option_tag">ALL</option>
                        {userList.map((elem, index) => (
                            <option key={index} value={elem} name="option_tag">{elem}</option>
                        ))}
                    </StyledTextInput>

                    <StyledTextInput as="select" name="file_type" onChange={e => setFileType(e.target.value)}>
                        <option value="lid">LID</option>
                        <option value="pos">POS</option>
                        <option value="matrix">Matrix</option>
                    </StyledTextInput>

                    <StyledKappa
                        name="cmi"
                        type='text'
                        placeholder='Enter CMI Threshold'
                        onChange={(e) => setCmi(e.target.value)}
                        required
                    />
                    <StyledButton type="submit">Download CSV</StyledButton>
                </StyledForm>
            </StyledFlexContainer>

            <StyledCompareForm method="POST" action={compareAnnotators} encType="multipart/form-data">
                <StyledFlexRow>
                    <StyledTextInput as="select" name="username1" placeholder='Enter username'>
                        {userList.map((elem, index) => (
                            <option key={index} value={elem} name="option_tag">{elem}</option>
                        ))}
                    </StyledTextInput>

                    <StyledTextInput as="select" name="username2" placeholder='Enter username'>
                        {userList.map((elem, index) => (
                            <option key={index} value={elem} name="option_tag">{elem}</option>
                        ))}
                    </StyledTextInput>

                    <StyledKappa
                        name="kappa"
                        type='text'
                        placeholder='Enter Kappa Threshold'
                        onChange={(e) => setKappa(e.target.value)}
                        required
                    />
                </StyledFlexRow>
                <StyledButton type="submit">Download Comparison CSV</StyledButton>
            </StyledCompareForm>
        </div>
    );
};
export default Admin;

const styledButton = {
    color: '#fff',
};

const styledForm = {
    border: '2px solid #efefef',
    padding: '20px',
    borderRadius: '12px'
};

const StyledForm = styled.form`
    border: 2px solid #efefef;
    padding: 20px;
    border-radius: 12px;
`;

const StyledFlexContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 20px;
`;

const StyledTextInput = styled.select`
    padding: 12px 8px;
    color: black;
    border: 2px solid #efefef;
    margin: 0px 8px;
    border-radius: 4px;
    width: 200px;
`;

const StyledKappa = styled.input`
    padding: 0px 8px !important;
    color: black !important;
    border: 2px solid #efefef !important;
    gap: 8px !important;
    border-radius: 4px !important;
    margin: 0px 8px !important;
    height: 40.8px !important;
`;

const StyledButton = styled.button`
    background-color: #502380;
    color: white;
    border-radius: 8px;
    padding: 6px 16px;
    /* width: 65px; */
    height: 40px;
    text-transform: uppercase;
    border: none;
    min-width: 120px;
`;

const StyledFlexRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 20px;
`;

const StyledCompareForm = styled.form`
    border: 2px solid #efefef;
    padding: 20px;
    border-radius: 12px;
    width: min-content;
    text-align: center;
    margin: 40px auto;
`;
