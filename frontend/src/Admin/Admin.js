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
            navigate('/admin');
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

    const adminFileUpload = process.env.REACT_APP_BACKEND_URL + '/admin-file-upload';
    const compareAnnotators = process.env.REACT_APP_BACKEND_URL + '/compare-annotators';

    return (
        <StyledContainer>
            <Navbar />
            <StyledMainContent>
                <StyledTopSection>
                    {/* File Upload Form */}
                    <StyledCard>
                        <StyledCardTitle>File Upload</StyledCardTitle>
                        <StyledForm onSubmit={handleFileUpload} encType="multipart/form-data">
                            <StyledFileInput 
                                type='file' 
                                name="file" 
                                onChange={e => setFile(e.target.files[0])} 
                            />
                            <StyledButton type="submit">Submit</StyledButton>
                        </StyledForm>
                    </StyledCard>

                    {/* CSV Download Form */}
                    <StyledCard>
                        <StyledCardTitle>CSV Download</StyledCardTitle>
                        <StyledForm method="POST" encType="multipart/form-data" onSubmit={handleDownload}>
                            <StyledInputRow>
                                <StyledSelect name="username">
                                    <option value="ALL">ALL</option>
                                    {userList.map((elem, index) => (
                                        <option key={index} value={elem}>{elem}</option>
                                    ))}
                                </StyledSelect>
                                
                                <StyledSelect name="file_type" onChange={e => setFileType(e.target.value)}>
                                    <option value="lid">LID</option>
                                    <option value="pos">POS</option>
                                    <option value="matrix">MATRIX</option>
                                    <option value="ner">NER</option>
                                    <option value="translation">TRANSLATION</option>
                                </StyledSelect>
                            </StyledInputRow>
                            
                            <StyledInput
                                name="cmi"
                                type='text'
                                placeholder='Enter CMI Threshold'
                                onChange={(e) => setCmi(e.target.value)}
                                required
                            />
                            <StyledButton type="submit">Download CSV</StyledButton>
                        </StyledForm>
                    </StyledCard>
                </StyledTopSection>

                <StyledIAASection>
                    <StyledCompareForm method="POST" action={compareAnnotators} encType="multipart/form-data">
                        <StyledTitle>Inter Annotator Agreement</StyledTitle>
                        
                        <StyledFormRow>
                            <StyledFieldGroup>
                                <StyledLabel>Task Type:</StyledLabel>
                                <StyledSelect name="task_type">
                                    <option value="lid">LID (Language Identification)</option>
                                    <option value="pos">POS (Part of Speech)</option>
                                    <option value="matrix">MATRIX</option>
                                    <option value="ner">NER (Named Entity Recognition)</option>
                                    <option value="translation">TRANSLATION</option>
                                </StyledSelect>
                            </StyledFieldGroup>

                            <StyledFieldGroup>
                                <StyledLabel>Kappa Type:</StyledLabel>
                                <StyledSelect 
                                    name="kappa_type" 
                                    value={kappaType}
                                    onChange={handleKappaTypeChange}
                                >
                                    <option value="cohen">Cohen's Kappa</option>
                                    <option value="fleiss">Fleiss' Kappa</option>
                                </StyledSelect>
                            </StyledFieldGroup>
                        </StyledFormRow>

                        <StyledFormRow>
                            <StyledSelect name="username1" required>
                                <option value="">Select Annotator 1</option>
                                {userList.map((elem, index) => (
                                    <option key={index} value={elem}>{elem}</option>
                                ))}
                            </StyledSelect>

                            <StyledSelect name="username2" required>
                                <option value="">Select Annotator 2</option>
                                {userList.map((elem, index) => (
                                    <option key={index} value={elem}>{elem}</option>
                                ))}
                            </StyledSelect>

                            {kappaType === 'fleiss' && (
                                <StyledSelect name="username3" required>
                                    <option value="">Select Annotator 3</option>
                                    {userList.map((elem, index) => (
                                        <option key={index} value={elem}>{elem}</option>
                                    ))}
                                </StyledSelect>
                            )}
                        </StyledFormRow>

                        <StyledFormRow>
                            <StyledInput
                                name="kappa"
                                type='number'
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder='Enter Kappa Threshold (0-1)'
                                onChange={(e) => setKappa(e.target.value)}
                                required
                            />
                        </StyledFormRow>

                        <StyledInfo>
                            <strong>Task:</strong> {fileType.toUpperCase()} | <strong>Agreement:</strong> {kappaType === 'cohen' ? "Cohen's Kappa (2 annotators)" : "Fleiss' Kappa (3 annotators)"}
                            <br />
                            {fileType.toUpperCase()}: Measures agreement on {fileType === 'lid' ? 'language identification' : fileType === 'pos' ? 'part of speech tagging' : fileType === 'ner' ? 'named entity recognition' : fileType === 'translation' ? 'translation quality' : 'annotation tasks'}
                        </StyledInfo>

                        <StyledButton type="submit" isPrimary>
                            Download IAA Results ({kappaType === 'cohen' ? "Cohen's" : "Fleiss'"} Kappa - {fileType.toUpperCase()})
                        </StyledButton>
                    </StyledCompareForm>
                </StyledIAASection>
            </StyledMainContent>
        </StyledContainer>
    );
};

export default Admin;

// Styled Components
const StyledContainer = styled.div`
    min-height: 100vh;
    background-color: #f8f9fa;
`;

const StyledMainContent = styled.div`
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
`;

const StyledTopSection = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 40px;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const StyledCard = styled.div`
    flex: 1;
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const StyledCardTitle = styled.h3`
    color: #502380;
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const StyledInputRow = styled.div`
    display: flex;
    gap: 12px;
    
    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const StyledFileInput = styled.input`
    padding: 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    
    &:focus {
        outline: none;
        border-color: #502380;
    }
`;

const StyledSelect = styled.select`
    padding: 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    min-width: 200px;
    
    &:focus {
        outline: none;
        border-color: #502380;
    }
`;

const StyledInput = styled.input`
    padding: 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    
    &:focus {
        outline: none;
        border-color: #502380;
    }
`;

const StyledButton = styled.button`
    background-color: ${props => props.isPrimary ? '#502380' : '#6c757d'};
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: ${props => props.isPrimary ? '#3d1b63' : '#5a6268'};
        transform: translateY(-1px);
    }
    
    &:active {
        transform: translateY(0);
    }
`;

const StyledIAASection = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledCompareForm = styled.form`
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 900px;
`;

const StyledTitle = styled.h2`
    color: #502380;
    margin: 0 0 32px 0;
    text-align: center;
    font-size: 24px;
    font-weight: 600;
`;

const StyledFormRow = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: end;
    
    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const StyledFieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
`;

const StyledLabel = styled.label`
    font-weight: 600;
    color: #495057;
    font-size: 14px;
`;

const StyledInfo = styled.div`
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
    border: 1px solid #87ceeb;
    border-radius: 8px;
    padding: 16px;
    margin: 24px 0;
    font-size: 14px;
    color: #2c5aa0;
    text-align: center;
    line-height: 1.5;
`;
