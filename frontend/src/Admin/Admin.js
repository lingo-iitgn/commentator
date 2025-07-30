import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Components
import Navbar from '../Components/Navbar';

const Admin = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState();
    const [userList, setUserList] = useState([]);
    const [fileType, setFileType] = useState('lid');
    const [cmi, setCmi] = useState(0);
    const [kappa, setKappa] = useState(0);
    const [kappaType, setKappaType] = useState('cohen');
    const [taskType, setTaskType] = useState('lid'); // New state for task selection
    const [showThirdAnnotator, setShowThirdAnnotator] = useState(false);
    
    useEffect(() => {
        const fetchUsernames = async () => {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fetch-users-list`, {
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
            const nonAdminUsers = res.data.result.filter(user => {
                if (typeof user === 'string') return true;
                if (typeof user === 'object') return !user.admin;
                return true;
            });
            setUserList(nonAdminUsers);
        };
    
        fetchUsernames();
    }, []);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(adminFileUpload, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // On success, navigate to /admin
            navigate('/');
        } catch (error) {
            console.error('File upload failed:', error);
        }
    };

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

    const handleKappaTypeChange = (e) => {
        const selectedType = e.target.value;
        setKappaType(selectedType);
        setShowThirdAnnotator(selectedType === 'fleiss');
    };

    const handleTaskTypeChange = (e) => {
        setTaskType(e.target.value);
    };

    const adminFileUpload = process.env.REACT_APP_BACKEND_URL + '/admin-file-upload';
    const compareAnnotators = process.env.REACT_APP_BACKEND_URL + '/compare-annotators';

    return (
        <div>
            <Navbar />
            <StyledFlexContainer>

                <form onSubmit={handleFileUpload} encType="multipart/form-data">
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
                        <option value="matrix">MATRIX</option>
                        <option value="ner">NER</option>
                        <option value="translation">TRANSLATION</option>
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

            <StyledIAASection>
                <StyledCompareForm method="POST" action={compareAnnotators} encType="multipart/form-data">
                    <StyledTitle>Inter Annotator Agreement</StyledTitle>
                    
                    {/* Task Type Selection */}
                    <StyledFlexRow>
                        <StyledLabel>Task Type:</StyledLabel>
                        <StyledTextInput 
                            as="select" 
                            name="task_type" 
                            value={taskType}
                            onChange={handleTaskTypeChange}
                            isCompareForm={true}
                        >
                            <option value="lid">LID (Language Identification)</option>
                            <option value="ner">NER (Named Entity Recognition)</option>
                            <option value="pos">POS (Part of Speech)</option>
                            <option value="matrix">Matrix (Matrix Language Identification)</option>
                        </StyledTextInput>
                    </StyledFlexRow>

                    {/* Kappa Type Selection */}
                    <StyledFlexRow>
                        <StyledLabel>Agreement Type:</StyledLabel>
                        <StyledTextInput 
                            as="select" 
                            name="kappa_type" 
                            value={kappaType}
                            onChange={handleKappaTypeChange}
                            isCompareForm={true}
                        >
                            <option value="cohen">Cohen's Kappa</option>
                            <option value="fleiss">Fleiss' Kappa</option>
                        </StyledTextInput>
                    </StyledFlexRow>

                    {/* Annotator Selection */}
                    <StyledFlexRow>
                        <StyledTextInput as="select" name="username1" placeholder='Select Annotator 1' required isCompareForm={true}>
                            <option value="">Select Annotator 1</option>
                            {userList.map((elem, index) => (
                                <option key={index} value={elem} name="option_tag">{elem}</option>
                            ))}
                        </StyledTextInput>

                        <StyledTextInput as="select" name="username2" placeholder='Select Annotator 2' required isCompareForm={true}>
                            <option value="">Select Annotator 2</option>
                            {userList.map((elem, index) => (
                                <option key={index} value={elem} name="option_tag">{elem}</option>
                            ))}
                        </StyledTextInput>

                        {kappaType === 'fleiss' && (
                            <StyledTextInput as="select" name="username3" placeholder='Select Annotator 3' required isCompareForm={true}>
                                <option value="">Select Annotator 3</option>
                                {userList.map((elem, index) => (
                                    <option key={index} value={elem} name="option_tag">{elem}</option>
                                ))}
                            </StyledTextInput>
                        )}
                    </StyledFlexRow>

                    <StyledFlexRow>
                        <StyledKappa
                            name="kappa"
                            type='number'
                            step="0.01"
                            min="0"
                            max="1"
                            placeholder='Enter Kappa Threshold (0-1)'
                            onChange={(e) => setKappa(e.target.value)}
                            required
                            isCompareForm={true}
                        />
                    </StyledFlexRow>
                    
                    <StyledInfo>
                        <strong>Task:</strong> {taskType.toUpperCase()} | 
                        <strong> Agreement:</strong> {kappaType === 'cohen' 
                            ? " Cohen's Kappa (2 annotators)" 
                            : " Fleiss' Kappa (3 annotators)"
                        }
                        <br />
                        {taskType === 'matrix' && "Matrix: Measures agreement on binary classification for Matrix Language Identification"}
                        {taskType === 'ner' && "NER: Measures agreement on entity recognition and classification"}
                        {taskType === 'pos' && "POS: Measures agreement on part-of-speech tagging"}
                        {taskType === 'lid' && "LID: Measures agreement on language identification"}
                    </StyledInfo>

                    <StyledButton type="submit" isCompareForm={true}>
                        Download IAA Results ({kappaType === 'cohen' ? "Cohen's" : "Fleiss'"} Kappa - {taskType.toUpperCase()})
                    </StyledButton>
                </StyledCompareForm>
            </StyledIAASection>
        </div>
    );
};

// export default Admin;

export default Admin;

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
    padding: 10px;
    margin-top: 80px;
`;

const StyledTextInput = styled.select`
    padding: 12px 8px;
    color: black;
    border: 2px solid #efefef;
    margin: 0px 8px;
    border-radius: 4px;    
    width: ${props => props.isCompareForm ? '250px' : '200px'};
    font-size: 14px;
`;

const StyledKappa = styled.input`
    padding: 0px 8px !important;
    color: black !important;
    border: 2px solid #efefef !important;
    gap: 8px !important;
    border-radius: 4px !important;
    margin: 0px 8px !important;
    align-items: center !important;
    height: 40.8px !important;
    width: ${props => props.isCompareForm ? '200px' : '150px'} !important;
    font-size: 14px !important;
`;

const StyledButton = styled.button`
    background-color: #502380;
    color: white;
    border-radius: 8px;
    padding: ${props => props.isCompareForm ? '8px 20px' : '6px 16px'};
    height: ${props => props.isCompareForm ? '44px' : '40px'};
    text-transform: uppercase;
    border: none;
    min-width: ${props => props.isCompareForm ? '200px' : '120px'};
    cursor: pointer;
    font-size: 14px;
    font-weight: ${props => props.isCompareForm ? '600' : 'normal'};
    
    &:hover {
        background-color: #3d1b63;
        transform: ${props => props.isCompareForm ? 'translateY(-1px)' : 'none'};
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const StyledFlexRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin: 15px 0;
    flex-wrap: wrap;
`;

const StyledCompareForm = styled.form`
    border: 2px solid #efefef;
    padding: 30px;
    border-radius: 12px;
    width: min-content;
    text-align: center;
    margin: 40px auto;
    min-width: 1100px;
    max-width: 1400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledTitle = styled.h2`
    color: #502380;
    margin-bottom: 20px;
    text-align: center;
`;

const StyledLabel = styled.label`
    font-weight: bold;
    color: #333;
    min-width: 120px;
    text-align: left;
    font-size: 14px;
`;

const StyledInfo = styled.div`
    background-color: #f0f8ff;
    border: 1px solid #87ceeb;
    border-radius: 6px;
    padding: 12px;
    margin: 15px auto; 
    font-size: 14px;
    max-width: 900px;
    color: #2c5aa0;
    text-align: center;
    line-height: 1.4;
`;

const StyledIAASection = styled.div`
    display: flex;
    justify-content: center;
`;
