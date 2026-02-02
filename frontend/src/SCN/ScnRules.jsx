import React from 'react';
import styled from 'styled-components';

const ScnRules = () => {
  return (
    <RulesPanel>
      <Title>Steps to Follow!</Title>

      <RulesList>
        <RuleItem>
          <Circle>1</Circle>
          <Text>
            <Strong>Detect and standardize spelling variants</Strong> in code-mixed text that refer to the same word across Roman and Devanagari.
          </Text>
        </RuleItem>

        <RuleItem>
          <Circle>2</Circle>
          <Text>
            <Strong>Normalize spelling variants</Strong> to a single standardized form<br />
            <Example>(e.g., "hain", "hai", "hayn" → "hain")</Example>
          </Text>
        </RuleItem>

        <RuleItem>
          <Circle>3</Circle>
          <Text>
            <Strong>Update the model predictions </Strong> where corrections are required.
          </Text>
        </RuleItem>

        <RuleItem>
          <Circle>4</Circle>
          <Text>
          <Strong>Preserve semantic meaning</Strong> while standardizing orthographic and informal spelling variations.
          </Text>
        </RuleItem>

        <RuleItem>
          <Circle>5</Circle>
          <Text>
          <Strong>Provide optional feedback</Strong> in the designated text box, if necessary.
          </Text>
        </RuleItem>

        <RuleItem>
          <Circle>6</Circle>
          <Text>
          <Strong>Click Submit</Strong> to save your normalized corrections.
          </Text>
        </RuleItem>

      </RulesList>
    </RulesPanel>
  );
};

export default ScnRules;

// ────────────────── OPTIMIZED FOR LEFT SIDEBAR & SINGLE PAGE ──────────────────

const RulesPanel = styled.div`
  background: linear-gradient(135deg, #f5f0ff 0%, #ede9ff 100%);
  border-radius: 16px;
  padding: 10px 10px 5px;
  box-shadow: 0 8px 25px rgba(107, 75, 143, 0.15);
  border: 1px solid #e0d6ff;
  
  /* Key changes for sidebar + no page break */
  width: 100%;
  max-width: 3000px;
  height: fit-content;
  max-height: 100vh;        /* Never exceed viewport height */
  overflow: hidden;         /* Prevent any internal scrolling */
  margin: 0px 0 0px 20px; /* Generous left margin for sidebar layout */
  box-sizing: border-box;
  
  font-family: 'Segoe UI', Arial, sans-serif;

  /* Print-friendly: forces everything on one page */
  @media print {
    max-height: none;
    overflow: visible;
    page-break-inside: avoid;
  }
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: #4a2c6b;
  letter-spacing: 0.8px;
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px; /* Reduced from 22px → tighter, fits better */
`;

const RuleItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const Circle = styled.div`
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  background: #6B4B8F;
  color: white;
  font-weight: bold;
  font-size: 1.0rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(107, 75, 143, 0.35);
`;

const Text = styled.div`
  flex: 1;
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
`;

const Strong = styled.strong`
  color: #4a2c6b;
  font-weight: 700;
`;

const Example = styled.span`
  display: block;
  margin-top: 6px;
  font-size: 0.92rem;
  color: #6b4b8f;
  font-style: italic;
  font-weight: 500;
`;