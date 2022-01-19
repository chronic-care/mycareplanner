import React, { createRef} from 'react';
import './ChoiceButton.css';
import { ButtonGroup, Button } from 'react-bootstrap';

// push/receive STATE on parent component

export default class ChoiceButton extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        // console.log('item props:', props)
        this.state = {
            activeButton: false,
            value: ''
        }
    }
    
    
    public render(): JSX.Element {
        let activeChoiceButton: any = createRef();
        let questionnaireItem = {
            linkId: this.props.linkId,
            type: this.props.type,
            prefix: this.props.prefix,
            answerOption: this.props.answerOption,
            text: this.props.text
        }
        const handleClick = (event: any) => {
            if(questionnaireItem.prefix && questionnaireItem.text) {
                questionnaireItem.text = questionnaireItem.prefix + ': ' + questionnaireItem.text;
            }
            collectAnswer(questionnaireItem, event.target.value)
            for (let child of activeChoiceButton.current.children) {
                if (child.value === event.target.value) {
                    child.classList.add('selected');
                } else {
                    child.classList.remove('selected');
                }
            }
        }

        const collectAnswer = (QuestionnaireItem: any, answer: string) => {
            this.props.parentCallback(QuestionnaireItem, answer);
        }

        return (
            <div className="choice-button-group">
                <p>{questionnaireItem.text}</p>
                <ButtonGroup ref={activeChoiceButton}>
                    {
                        questionnaireItem.answerOption?.map((answerOption: any) => {
                            return <Button key={JSON.stringify(answerOption)}
                                size="sm"
                                aria-required="true"
                                variant="outline-secondary"
                                value={JSON.stringify(answerOption)}
                                onClick={(event: any) =>
                                    handleClick(event)
                                }>
                                {answerOption.valueCoding?.display}
                            </Button>
                        })
                    }
                </ButtonGroup>
            </div>
        )
    }
}