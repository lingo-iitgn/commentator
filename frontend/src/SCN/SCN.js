import Navbar from '../Components/Navbar';
import { StyledButton } from '../utils/styles';
import styled from 'styled-components';
import ScnRules from './ScnRules';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

const Scnrules = () => {
  const navigate = useNavigate();

  const [sentence, setSentence] = useState('Loading Sentence...');
  const [scn_id, setScnId] = useState('');
  const [fullTransliteration, setFullTransliteration] = useState('');
  const [hasDevanagari, setHasDevanagari] = useState(false);
  const [isDataEmpty, setIsDataEmpty] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [inputMode, setInputMode] = useState('auto'); // 'auto' | 'devanagari' | 'roman'

  const containsDevanagari = (text) => {
    if (!text) return false;
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text);
  };

  // Fetch sentence
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let scnIdFromSession = JSON.parse(sessionStorage.getItem('scn_id')) || 0;
        if (scnIdFromSession === 0) scnIdFromSession += 1;
        sessionStorage.setItem('scn_id', JSON.stringify(scnIdFromSession));

        const res = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/get-scn-sentence`,
          { scn_id: scnIdFromSession },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.data.result) {
          const dict = res.data.result;

          const originalSentence = dict['sentence'] || '';
          const correctedSentence = dict['scn_sentence'] || originalSentence;

          setSentence(originalSentence);
          setScnId(dict['scn_id'] || '');
          setFullTransliteration(correctedSentence);

          // Only used for "auto" mode
          setHasDevanagari(containsDevanagari(correctedSentence));

          setIsDataEmpty(false);
          setStartTime(new Date());
        } else {
          setIsDataEmpty(true);
          setFullTransliteration('');
          setHasDevanagari(false);
        }
      } catch (e) {
        console.error(e);
        setIsDataEmpty(true);
        setFullTransliteration('');
        setHasDevanagari(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const useAutoResize = (maxLines = 3) => {
    const ref = React.useRef(null);

    const resize = () => {
      const el = ref.current;
      if (el) {
        el.style.height = "auto";
        const lineHeight = parseInt(window.getComputedStyle(el).lineHeight, 10);
        const maxHeight = lineHeight * maxLines;
        const newHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${newHeight}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
      }
    };

    return [ref, resize];
  };

  const [textareaRef, resizeTextarea] = useAutoResize(3);

  useEffect(() => {
    resizeTextarea();
  }, [fullTransliteration, resizeTextarea]);

  

  const onSubmitHandler = async () => {
    if (isSubmitting) return;
  
    setIsSubmitting(true);
  
    const username = JSON.parse(sessionStorage.getItem('annote_username'));
    const scn_id = JSON.parse(sessionStorage.getItem('scn_id'));
    const endTime = new Date();
    const timeDifference = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : 0;
  
    const payload = {
      scn_id,
      sentence,
      username,
      fullTransliteration,
      feedback,
      timeDifference,
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
  
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/submit-scn-sentence`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      // Only increment and reload on success (non-duplicate)
      sessionStorage.setItem('scn_id', JSON.stringify(scn_id + 1));
      window.location.reload();
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Decide which input to show
  // const shouldUseDevanagari =
  //   inputMode === 'devanagari' ||
  //   (inputMode === 'auto' && hasDevanagari);

  // Only use Devanagari input when explicitly chosen
  const shouldUseDevanagari = inputMode === 'devanagari';
  return (
    <StyledContainer>
      <Navbar />
      <StyledGridder>
        <ScnRules />
        <StyledRightContainer>

          <StyledSentenceId>#{scn_id}</StyledSentenceId>

          {/* Original Sentence */}
          <StyledSentenceContainer>
            <StyledDisplaySentenceContainer>
              {isLoading ? (
                <StyledBox>Loading...</StyledBox>
              ) : !isDataEmpty ? (
                <StyledSentence>{sentence}</StyledSentence>
              ) : (
                <StyledBox>
                  You are done with all the sentences. Please ask the administrator to upload the next set of sentences.
                </StyledBox>
              )}
            </StyledDisplaySentenceContainer>
          </StyledSentenceContainer>

          {!isLoading && !isDataEmpty && (
            <>
              {/* Toggle Switch */}
              <StyledToggleWrapper>
                <span style={{ fontWeight: 600 }}>Input Mode:</span>
                <label style={{ marginLeft: '16px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="inputMode"
                    value="auto"
                    checked={inputMode === 'auto'}
                    onChange={(e) => setInputMode(e.target.value)}
                  /> Auto
                </label>
                <label style={{ marginLeft: '16px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="inputMode"
                    value="devanagari"
                    checked={inputMode === 'devanagari'}
                    onChange={(e) => setInputMode(e.target.value)}
                  /> देवनागरी 
                </label>
                <label style={{ marginLeft: '16px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="inputMode"
                    value="roman"
                    checked={inputMode === 'roman'}
                    onChange={(e) => setInputMode(e.target.value)}
                  /> Roman/English
                </label>
              </StyledToggleWrapper>

              <StyledFullTransliterateWrapper>
                <StyledWordBreakup>Corrected and normalized sentence</StyledWordBreakup>

                {shouldUseDevanagari ? (
                  <ReactTransliterate
                    lang="hi"
                    value={fullTransliteration}
                    onChangeText={(text) => {
                      setFullTransliteration(text);
                      setTimeout(resizeTextarea, 0);
                    }}
                    containerClassName="devanagari-container"
                    renderComponent={(inputProps) => (
                      <textarea
                        {...inputProps}
                        ref={(el) => {
                          if (typeof inputProps.ref === "function") inputProps.ref(el);
                          else if (inputProps.ref) inputProps.ref.current = el;
                          textareaRef.current = el;
                        }}
                        rows={1}
                        placeholder="देवनागरी में टाइप करें..."
                        style={{
                          width: "100%",
                          fontSize: "1.5rem",
                          lineHeight: "1.6",
                          padding: "14px",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          backgroundColor: "#fafafa",
                          resize: "none",
                          overflow: "hidden",
                          minHeight: "calc(1.6em * 2 + 28px)",   /* Exactly 2 lines tall initially */
                          boxSizing: "border-box",
                          fontFamily: "'Noto Sans Devanagari', Arial, sans-serif",
                        }}
                      />
                    )}
                  />
                ) : (
                  <StyledNormalTextarea
                    ref={textareaRef}
                    value={fullTransliteration}
                    onChange={(e) => {
                      setFullTransliteration(e.target.value);
                      setTimeout(resizeTextarea, 0);
                    }}
                    placeholder="Type in English or Romanized Hindi..."
                  />
                )}
              </StyledFullTransliterateWrapper>
            </>
          )}

   
        <StyledFlexd>
        <FeedbackButton 
          onClick={() => setFeedbackVisible(!feedbackVisible)}
          $hasFeedback={feedback.trim().length > 0}
        >
          {feedbackVisible 
            ? '✐ Feedback (click to hide)' 
            : '✐ Add Feedback'
          }
          {feedback.trim() && !feedbackVisible && <span style={{marginLeft: '8px'}}>✓</span>}
        </FeedbackButton>

        {feedbackVisible && (
          <InlineFeedbackWrapper>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              autoFocus
            />
          </InlineFeedbackWrapper>
        )}
      </StyledFlexd>

          {/* Submit Button */}
          {!isDataEmpty && !isLoading && (
            <StyledSubmitContainer>
              <StyledButton
                style={{ width: '100%' }}
                variant="contained"
                onClick={onSubmitHandler}
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitHandler();
                  }
                }}
              >
                Submit 
              </StyledButton>
            </StyledSubmitContainer>
          )}

        </StyledRightContainer>
      </StyledGridder>
    </StyledContainer>
  );
};

export default Scnrules;

const StyledContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 30px;
`;

const FeedbackButton = styled.button`
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  background-color: #6B4B8F;          
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.2);
  }

  &:active {
    transform: translateY(0);
  }

  /* This will be overridden dynamically in JSX when feedback exists */
  ${props => props.$hasFeedback && `
    background-color: #502380;
  `}
`;

const InlineFeedbackWrapper = styled.div`
  margin-left: 20px;
  flex: 1;
  animation: fadeIn 0.25s ease-out;

  textarea {
    width: 100%;
    min-width: 280px;
    max-width: 300px;
    padding: 10px 14px;
    font-size: 1rem;
    line-height: 1.0;
    border: 2px solid #2196f3;
    border-radius: 12px;
    background-color: white;
    resize: none;
    outline: none;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
  }

  textarea:focus {
    border-color: #6B4B8F;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;
const StyledGridder = styled.div`
  display: grid;
  grid-template-columns: 1fr 4fr;
  gap: 20px;
  overflow-y: auto;
  width: 100%;
  padding: 10px 20px;
`;

const StyledRightContainer = styled.div`
  border-left: 3px solid #efefef;
  margin-left: 12px;
  padding-left: 12px;
`;

const StyledSentenceId = styled.div`
  background-color: #efefef;
  border-radius: 12px;
  padding: 12px;
  position: fixed;
  top: 75px;
  right: 20px;
  font-weight: bold;
  z-index: 10;
`;

const StyledSentenceContainer = styled.div`
  border: 2px solid #efefef;
  padding: 10px;
  border-radius: 12px;
  width: 93%;
  text-align: center;
  margin: 22px auto;
`;

const StyledDisplaySentenceContainer = styled.div`
  margin: 2px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StyledSentence = styled.p`
  font-size: 28px;
  margin: 12px;
  text-align: left;
  background-color: #efefef;
  padding: 18px;
  border-radius: 12px;
`;

const StyledBox = styled.div`
  position: absolute;
  padding: 20px;
  top: 70px;
  width: 73%;
  height: 70%;
  text-align: center;
  background-color: white;
  font-size: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledWordBreakup = styled.div`
  font-size: 20px;
  text-align: center;
  margin: 24px auto 10px auto;
  font-weight: 600;
`;

const StyledFullTransliterateWrapper = styled.div`
  margin: 30px auto;
  width: 90%;
  text-align: center;
`;

// NEW: Toggle wrapper style
const StyledToggleWrapper = styled.div`
  text-align: center;
  margin: 20px auto;
  padding: 14px;
  background: #F0E5FF;
  border: 1px solid #bde0fe;
  border-radius: 10px;
  width: 90%;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledNormalTextarea = styled.textarea`
  width: 100%;
  font-size: 1.5rem;
  line-height: 1.6;
  padding: 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fafafa;
  resize: none;                  /* Important: disable manual resize */
  overflow: hidden;             /* Hide scrollbar until needed */
  min-height: 60px;             /* Initial single-line look */
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
`;

const StyledFlexd = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  width: 87%;
  margin: 15px auto;
  flex-wrap: wrap;
`;

const StyledSubmitContainer = styled.div`
  width: 20%;
  text-align: center;
  margin: 30px auto 0 auto;
`;

