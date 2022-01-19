import React, { createRef } from 'react';
import { QuestionnaireItem, QuestionnaireItemAnswerOption, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from '../../fhir-types/fhir-r4';
import './QuestionnaireItemComponent.css';
import { Card, Button } from 'react-bootstrap';
import MultiSelectButtonComponent from '../multi-select-button/MultiSelectButton';
import { faArrowAltCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChoiceButton from '../choice-button/ChoiceButton';
import parser from 'html-react-parser';
import YouTube from 'react-youtube';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'

interface QuestionnaireItemState {
  showReview: boolean,
  questionnaireResponse: QuestionnaireResponseItem
}
export default class QuestionnaireItemComponent extends React.Component<any, QuestionnaireItemState> {
  constructor(props: any) {
    super(props);
    this.state = {
      showReview: false,
      questionnaireResponse: {
        linkId: props.QuestionnaireItem.linkId,
        text: props.QuestionnaireItem.prefix + ": " + props.QuestionnaireItem.text,
        item: [],
      }
    }
  }
  questionnaireItemRef: any = createRef();
  vidRef: any = createRef();

  handleNextQuestionScroll(linkId: number) {
    if (this.questionnaireItemRef.current.id === linkId) {
      if (this.vidRef.current !== null) {
        this.stopVideos();
      }
      if (this.questionnaireItemRef.current.nextSibling) {
        this.questionnaireItemRef.current.nextSibling.classList.add('active')
        this.questionnaireItemRef.current.classList.remove('active')
        this.questionnaireItemRef.current.nextSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
        // console.log('current ref: ', this.questionnaireItemRef.current.children)
      }
    }
    if (!this.questionnaireItemRef.current.nextSibling.classList.contains('questionnaire-item')) {
      this.setState({ showReview: true }, () => {
        this.props.receivingCallback(this.state.showReview);
      });
    }
  }
  handlePreviousQuestionScroll(linkId: number) {
    if (this.questionnaireItemRef.current.id === linkId) {
      if (this.vidRef.current !== null) {
        this.stopVideos();
      }
      this.questionnaireItemRef.current.previousSibling.classList.add('active')
      this.questionnaireItemRef.current.classList.remove('active')
      this.questionnaireItemRef.current.previousSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }

  }
  stopVideos() {
    let videos = document.querySelectorAll('iframe, video');
    Array.prototype.forEach.call(videos, function (video) {
      if (video.tagName.toLowerCase() === 'video') {
        video.pause();
      } else {
        var src = video.src;
        video.src = src;
      }
    });
  }

  public render(): JSX.Element {
    let text = '';
    if (!this.props.QuestionnaireItem.text) {
      text = ''
    } else {
      text = this.props.QuestionnaireItem.text
    }
    const percentage = (item: number, length: number): number => {
      item = Number(item)
      if (!isNaN(item) && item !== null) {
        let percent = (item - 1) / length;
        if (!isNaN(percent)) {
          return Math.round(percent * 100);
        } else {
          return 0;
        }

      } else {
        return 0;
      }
    }

    let processTextResponse = (questionItem: QuestionnaireItem, answer: any) => {
      let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer);
      let childResponse: QuestionnaireResponseItem = {
        linkId: questionItem.linkId,
        text: questionItem.text,
        answer: [responseAnswer]
      };

      this.props.onChange(childResponse);
    }


    let recordWebsiteVisit = (event: any) => {
      let timeStamp: any = new Date().toISOString();
      processTextResponse(this.props.QuestionnaireItem, JSON.stringify({ valueDateTime: timeStamp }))
    }
    const vidOptions = {
      width: "100%",
      height: "200",
      playerVars: {
      }
    }


    const options = {
      replace: (domNode: any) => {
        // psa-video
        if (domNode?.next?.attribs?.id === 'youtube' && domNode?.next?.attribs?.value !== undefined) {
          // return <iframe title="Flat Tire Video" ref={this.vidRef} width="100%" height="200" src="https://www.youtube.com/embed/QWcr9J3MLfo" frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" onEnded={recordWebsiteVisit} allowFullScreen></iframe>
          let youtubeId = domNode?.next?.attribs?.value
          return <YouTube
            id="youtube-video"
            ref={this.vidRef}
            videoId={youtubeId}
            opts={vidOptions}
            onEnd={recordWebsiteVisit}
          />
        // psa-benefits-link
        } else if (domNode?.next?.attribs?.id === 'website' && domNode?.next?.attribs?.value !== undefined) {
          let website = domNode?.next?.attribs?.value
          return <a id="replace" className="d-flex justify-content-center mt-1" target="_blank" 
            rel="noopener noreferrer" href={website} ><button onClick={recordWebsiteVisit} className="btn btn-outline-secondary">Visit Web Site</button></a>
        }
      }
    }


    return (
      <Card ref={this.questionnaireItemRef} className={"questionnaire-item"} id={this.props.QuestionnaireItem.linkId}>
        <div className="questionnaire-section-header">
          {this.props.QuestionnaireItem.linkId === '1' ? ('')
            :
            (
              <Button className="btn-outline-secondary previous-button"
                value={this.props.QuestionnaireItem.linkId}
                onClick={(event: any) => this.handlePreviousQuestionScroll(event.target.value)}>
                <FontAwesomeIcon
                  icon={faArrowAltCircleLeft}
                  onClick={(event: any) => this.handlePreviousQuestionScroll(this.props.QuestionnaireItem.linkId)} />
              </Button>
            )}
          <div className="prefix-text">
            <h3>{this.props.QuestionnaireItem.prefix}</h3>
          </div>
          <div className="progress-circle">
            <CircularProgressbar value={percentage(this.props.QuestionnaireItem.linkId, this.props.length)} text={percentage(this.props.QuestionnaireItem.linkId, this.props.length) + '%'} />
          </div>
        </div>
        <div className="description-text">
          <div> {parser(text, options)}</div>
        </div>
        <div>
          {
            this.props.QuestionnaireItem.type === "boolean" ?
              <div className="boolean-type">
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => this.props.onChange(this.props.QuestionnaireItem, [{ valueBoolean: true }])} /> <label htmlFor={this.props.QuestionnaireItem.linkId}> Yes</label>
                </div>
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => this.props.onChange(this.props.QuestionnaireItem, [{ valueBoolean: false }])} /><label htmlFor={this.props.QuestionnaireItem.linkId}> No</label>
                </div>
              </div>
              : this.props.QuestionnaireItem.type === "choice" ?
                <div className="choice-type">
                  {this.populateChoice(this.props)}
                </div>
                : this.props.QuestionnaireItem.type === "quantity" ?
                  <div className="quantity-type">
                    <input type="text" onChange={(event) => this.props.onChange(this.props.QuestionnaireItem, [{ valueQuantity: { value: parseFloat(event.target.value) } }])} /> days
                    </div>
                  : this.props.QuestionnaireItem.type === "group" ?
                    <div className="open-choice-type">
                      {this.populateGroupType(this.props)}
                    </div>

                    : this.props.QuestionnaireItem.type === "text" ?
                      <div className="text-type">
                        <textarea placeholder="Type your answer here......"
                          onChange={(event) => {
                            processTextResponse(this.props.QuestionnaireItem, JSON.stringify({ valueString: event.target.value }))
                          }}
                        />
                      </div>
                      : <div></div>
          }
        </div>
        <div>
          {
            this.props.QuestionnaireItem.item ? this.props.QuestionnaireItem.item.map((item: any, key: any) =>
              <QuestionnaireItemComponent QuestionnaireItem={item} key={key} onChange={this.props.onChange} />
            ) : null
          }
        </div>
        <Button className="btn btn-primary next-button" value={this.props.QuestionnaireItem.linkId} onClick={(event: any) => this.handleNextQuestionScroll(event.target.value)}>Next</Button>
      </Card>
    );
  }


  // public populateChoice(props: { QuestionnaireItem: QuestionnaireItem, onChange: (item: QuestionnaireItem, answer?: QuestionnaireResponseItemAnswer[]) => void }) {
  public populateChoice(props: any) {


    let receiveData = (childData: QuestionnaireItem, answer: string) => {
      let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer)
      let childResponse: QuestionnaireResponseItem = {
        linkId: childData.linkId,
        text: childData.text,
        answer: [responseAnswer]
      };

      let joined = this.state.questionnaireResponse.item;

      // const updateItem = (array: any, response: any) => {

      // }
      const addItem = (response: any) => {
        this.setState(state => {
          const questionnaireResponse = {
            linkId: state.questionnaireResponse.linkId,
            text: state.questionnaireResponse.text,
            item: state.questionnaireResponse.item!.concat(response)
          };

          return {
            showReview: this.state.showReview,
            questionnaireResponse
          }
        }, () => {
          props.onChange(this.state.questionnaireResponse);
        })
      }

      if (joined!.length > 0) {
        for (let i = 0; i < joined!.length; i++) {

        }
      } else {
        addItem(childResponse);
      }



    }

    return (
      <ChoiceButton parentCallback={receiveData} key={JSON.stringify(props.QuestionnaireItem)} {...props.QuestionnaireItem}></ChoiceButton>

    );
  }

  public populateGroupType(props: any) {

    let receiveData = (childData: QuestionnaireResponseItem, answer: any) => {
      let childResponse: QuestionnaireResponseItem = {
        linkId: childData.linkId,
        text: childData.text,
        answer: [JSON.parse(answer)]
      };

      const checkResponseArray = (obj: QuestionnaireResponseItem) => obj.linkId === childResponse.linkId;
      const stateQuestionnaireResponse = this.state.questionnaireResponse;

      if (!stateQuestionnaireResponse.item!.some(checkResponseArray)) {
        this.setState(state => {
          const questionnaireResponse = {
            linkId: state.questionnaireResponse.linkId,
            text: state.questionnaireResponse.text,
            item: state.questionnaireResponse.item!.concat([childResponse])
          };
          return {
            showReview: this.state.showReview,
            questionnaireResponse
          }

        }, () => {
          props.onChange(this.state.questionnaireResponse);
        })
      } else if (stateQuestionnaireResponse.item!.some(checkResponseArray)) {

        this.setState(state => {
          for (let i in stateQuestionnaireResponse.item!) {
            if (stateQuestionnaireResponse.item[i].linkId === childResponse.linkId) {
              stateQuestionnaireResponse.item[i].answer = childResponse.answer
            }
          }

        }, () => {
          props.onChange(this.state.questionnaireResponse);
        })
      }

    }

    if (props.QuestionnaireItem.code![0].code === 'pain-location' || props.QuestionnaireItem.code![0].code === 'about-my-treatments') {
      return (
        <div>
          {
            props.QuestionnaireItem.item?.map((item: any) => {
              return (
                <MultiSelectButtonComponent sectionCode={props.QuestionnaireItem.code![0].code} parentCallback={receiveData} key={JSON.stringify(item)}  {...item}>{item.answerOption}</MultiSelectButtonComponent>
              )
            })
          }
        </div>
      );
    } else {
      return (
        <div>
          {
            props.QuestionnaireItem.item?.map((item: QuestionnaireItemAnswerOption) => {
              return (
                <ChoiceButton parentCallback={receiveData} key={JSON.stringify(item)} {...item}></ChoiceButton>
              )
            })

          }
        </div>
      )
    }
  }

}
