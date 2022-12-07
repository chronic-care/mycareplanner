import React, { createRef } from 'react';
import { QuestionnaireItem, QuestionnaireItemAnswerOption, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from '../../data-services/fhir-types/fhir-r4';
import './QuestionnaireItemComponent.css';
import { Card, Button } from 'react-bootstrap';
import { faArrowAltCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChoiceDropDown from './ChoiceDropDown';
// import MultiSelectButtonComponent from '../multi-select-button/MultiSelectButton';
import parser from 'html-react-parser';
import YouTube from 'react-youtube';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'
import { isNullOrUndefined } from 'util';
import Grid from '@mui/material/Grid'

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
        text: (props.QuestionnaireItem.prefix !== undefined ? props.QuestionnaireItem.prefix + ": " : "") + props.QuestionnaireItem.text,
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
    if (this.questionnaireItemRef.current.id === linkId && this.questionnaireItemRef.current.previousSibling !== null) {
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


    let recordWebsiteVisit = (event: any) => {
      let timeStamp: any = new Date().toISOString();
      this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueDateTime: timeStamp }))
    }
    const vidOptions = {
      width: "100%",
      height: "200",
      playerVars: {
      }
    }


    const options = {
      replace: (domNode: any) => {
        // embedded YouTube video
        if (domNode?.next?.attribs?.id === 'youtube' && domNode?.next?.attribs?.value !== undefined) {
          let youtubeId = domNode?.next?.attribs?.value
          return <YouTube
            id="youtube-video"
            ref={this.vidRef}
            videoId={youtubeId}
            opts={vidOptions}
            onEnd={recordWebsiteVisit}
          />
          // website link
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
          {this.props.QuestionnaireItem.prefix !== undefined ? <div className="prefix-text">
            <h3>{this.props.QuestionnaireItem.prefix}</h3>
          </div> : <div />}
          {/* <div className="progress-circle">
            <CircularProgressbar value={percentage(this.props.QuestionnaireItem.linkId, this.props.length)} text={percentage(this.props.QuestionnaireItem.linkId, this.props.length) + '%'} />
          </div> */}
        </div>

        {/* For groups, show item text as H4 header */}
        {this.props.QuestionnaireItem.type === "group" ? <div className="description-text">
          <h4> {parser(text, options)}</h4>
        </div> : <div />}

        {/* For display items, modify the text to show YouTube videos or embedded images, if included in the question HTML text. */}
        {this.props.QuestionnaireItem.type === "display" ? <div className="description-text">
          {parser(text, options)}
        </div> : <div />}

        <div>
          {
            this.props.QuestionnaireItem.type === "boolean" ?
              <div className="boolean-type">
                <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                <p>&nbsp;</p>
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => {
                    this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueBoolean: true }))
                  }} />
                  <label htmlFor={this.props.QuestionnaireItem.linkId}> Yes</label>
                </div>
                <div className="radio-button">
                  <input type="radio" name={this.props.QuestionnaireItem.linkId} onChange={() => this.props.onChange(this.props.QuestionnaireItem, [{ valueBoolean: false }])} /><label htmlFor={this.props.QuestionnaireItem.linkId}> No</label>
                </div>
              </div>
              : this.props.QuestionnaireItem.type === "choice" ?
                <div className="choice-type">
                  {this.populateChoice(this.props.QuestionnaireItem)}
                </div>
                : (this.props.QuestionnaireItem.type === "quantity" || this.props.QuestionnaireItem.type === "decimal") ?
                  <div className="question-group">
                    <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                    <input type="number" onChange={(event) => this.props.onChange(this.props.QuestionnaireItem, [{ valueQuantity: { value: parseFloat(event.target.value) } }])} />
                  </div>
                  : this.props.QuestionnaireItem.type === "group" ?
                    <div className="open-choice-type">
                      {this.populateGroupType(this.props)}
                    </div>

                    : (this.props.QuestionnaireItem.type === "text" || this.props.QuestionnaireItem.type === "string") ?
                      <div className="question-group">
                        <p className="question-text">{this.props.QuestionnaireItem.text}</p>
                        <textarea placeholder="Type your answer here......"
                          onChange={(event) => {
                            this.processResponse(this.props.QuestionnaireItem, JSON.stringify({ valueString: event.target.value }))
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

  private processResponse = (questionItem: QuestionnaireItem, answer: any) => {
    let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer);
    let childResponse: QuestionnaireResponseItem = {
      linkId: questionItem.linkId,
      text: questionItem.text,
      answer: [responseAnswer]
    };

    this.props.onChange(childResponse);
  }

  private populateChoice(item: QuestionnaireItem) {

    let receiveData = (childData: QuestionnaireItem, answer: string) => {
      let responseAnswer: QuestionnaireResponseItemAnswer = JSON.parse(answer)
      let childResponse: QuestionnaireResponseItem = {
        linkId: childData.linkId,
        text: childData.text,
        answer: [responseAnswer]
      };

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
          this.props.onChange(this.state.questionnaireResponse);
        })
      }

      addItem(childResponse);
    }

    return (
      <ChoiceDropDown parentCallback={receiveData} key={JSON.stringify(item)} {...item}></ChoiceDropDown>
    );
  }

  private populateGroupType(props: any) {
    let groupItem = props.QuestionnaireItem

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
          this.props.onChange(this.state.questionnaireResponse);
        })
      } else if (stateQuestionnaireResponse.item!.some(checkResponseArray)) {

        this.setState(state => {
          for (let i in stateQuestionnaireResponse.item!) {
            if (stateQuestionnaireResponse.item[i].linkId === childResponse.linkId) {
              stateQuestionnaireResponse.item[i].answer = childResponse.answer
            }
          }

        }, () => {
          this.props.onChange(this.state.questionnaireResponse);
        })
      }

    }

    return (
      <div>
        {
          groupItem.item?.map((nestedItem: QuestionnaireItem) => {
            return (
              <div key={JSON.stringify(nestedItem)}>
                {
                  nestedItem.type === "boolean" ?
                    <div className="boolean-type">
                      <Grid container spacing={1}>
                        <Grid item xs={8}>
                          <p className="question-text">{nestedItem.text}</p>
                        </Grid>
                        <Grid item xs={2}>
                          <div className="radio-button">
                            <input type="radio" name={nestedItem.linkId} onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueBoolean: true }))
                            }} />
                            <label htmlFor={nestedItem.linkId}> Yes</label>
                          </div>
                        </Grid>
                        <Grid item xs={2}>
                          <div className="radio-button">
                            <input type="radio" name={nestedItem.linkId} onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueBoolean: false }))
                            }} />
                            <label htmlFor={nestedItem.linkId}> No</label>
                          </div>
                        </Grid>
                      </Grid>
                    </div>
                    : nestedItem.type === "choice" ?
                      <div className="choice-type">
                        {this.populateChoice(nestedItem)}
                      </div>
                      : (nestedItem.type === "quantity" || nestedItem.type === "decimal") ?
                        <div className="question-group">
                          <p className="question-text">{nestedItem.text}</p>
                          <input type="number"
                            onChange={(event) => {
                              this.processResponse(nestedItem, JSON.stringify({ valueQuantity: { value: parseFloat(event.target.value) } }))
                            }} />
                        </div>
                        : (nestedItem.type === "text" || nestedItem.type === "string") ?
                          <div className="question-group">
                            <p className="question-text">{nestedItem.text}</p>
                            <textarea placeholder="Type your answer here......"
                              onChange={(event) => {
                                this.processResponse(nestedItem, JSON.stringify({ valueString: event.target.value }))
                              }}
                            />
                          </div>
                          : <div></div>
                }
              </div>
            )
          })
        }
      </div>
    )

    // if (props.QuestionnaireItem.code![0].code === 'pain-location' || props.QuestionnaireItem.code![0].code === 'about-my-treatments') {
    //   return (
    //     <div>
    //       {
    //         props.QuestionnaireItem.item?.map((item: any) => {
    //           return (
    //             <MultiSelectButtonComponent sectionCode={props.QuestionnaireItem.code![0].code} parentCallback={receiveData} key={JSON.stringify(item)}  {...item}>{item.answerOption}</MultiSelectButtonComponent>
    //           )
    //         })
    //       }
    //     </div>
    //   );
    // } else {
    // return (
    //   <div>
    //     {
    //       props.QuestionnaireItem.item?.map((item: QuestionnaireItemAnswerOption) => {
    //         return (
    //           <ChoiceButton parentCallback={receiveData} key={JSON.stringify(item)} {...item}></ChoiceButton>
    //         )
    //       })

    //     }
    //   </div>
    // )
    // }
    // }

  }
}
