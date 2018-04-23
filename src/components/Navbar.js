import React from 'react';
import ReactDOM from 'react-dom';
const { Nav, NavItem, Modal, Button, Col, Row, Grid, Tabs, Tab } = require('react-bootstrap/lib');
const Constant = require("../util/constants");
const session = require('electron').remote.session;
import { observer } from "mobx-react"
import AutographaStore from "./AutographaStore"
import SettingsModal from "./Settings"
import AboutUsModal from "./About"
import SearchModal from "./Search"
import DownloadModal from "./Download"
import TranslationPanel  from '../components/TranslationPanel';
const refDb = require(`${__dirname}/../util/data-provider`).referenceDb();
const db = require(`${__dirname}/../util/data-provider`).targetDb();
const injectTapEventPlugin = require("react-tap-event-plugin");
import  ReferencePanel  from '../components/ReferencePanel';
import  Footer  from '../components/Footer';
import Reference from "./Reference";
import { FormattedMessage } from 'react-intl';
import { Toggle } from 'material-ui';
const DiffMatchPatch = require('diff-match-patch');
const dmp_diff = new DiffMatchPatch();


let exportHtml = require(`${__dirname}/../util/export_html.js`);
let currentBook, book;

injectTapEventPlugin();

@observer
class Navbar extends React.Component {
    constructor(props) {
      super(props);
        this.handleRefChange = this.handleRefChange.bind(this);
        this.getData = this.getData.bind(this);
        this.state = {
            showModal: false,
            showModalSettings: false,
            showModalSearch: false,
            showModalDownload: false,
            data: Constant,
            chapData: [],
            bookNo:1,
            defaultRef: 'eng_ulb',
            defaultRefOne: 'eng_ulb',
            refList: [],
            searchVal: "", 
            replaceVal:"",
            toggled: false
        };
       
        var verses, chunks, chapter;
        var that = this;
        refDb.get("ref_history").then(function(doc) {
            var bookName = doc.visit_history[0].book; 
            var book = doc.visit_history[0].bookId;
            chapter = doc.visit_history[0].chapter;
            AutographaStore.bookId = book.toString();
            AutographaStore.chapterId = chapter;
            AutographaStore.verses = verses;
            db.get(AutographaStore.bookId).then(function(doc) {
                refDb.get('refChunks').then(function(chunkDoc) {
                    AutographaStore.verses = doc.chapters[parseInt(AutographaStore.chapterId, 10) - 1].verses;
                    AutographaStore.chunks = chunkDoc.chunks[parseInt(AutographaStore.bookId, 10) - 1];
                    chapter = AutographaStore.chapterId
                    that.getRefContents(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter.toString());
                })
            })
        }).catch(function(err) {
            AutographaStore.bookId = "1";
            AutographaStore.chapterId = "1";
            console.log(err)
        });
    }
    getContent = (id, chapter) => {
        return refDb.get(id).then( (doc) => { 
            for (var i = 0; i < doc.chapters.length; i++) {
                if (doc.chapters[i].chapter == parseInt(chapter, 10)) { 
                    break;
                }
            }
            let refString = doc.chapters[i].verses.map((verse, verseNum) => {
                return `<div type="ref" class="col-12 col-ref ref-contents ${doc.scriptDirection.toLowerCase()}" dir=${doc.scriptDirection}><div data-verse=r${(verseNum + 1)}><span class="verse-num"> ${doc.scriptDirection == "LTR" ? (verseNum + 1) : (verseNum + 1)} </span><span> ${verse.verse}</span></div></div`;
            }).join('');
            return refString;
        }, (err) => {
            console.log(err)
        });
    }

    getDiffText = (refId1, refId2, book, chapter) => {
        let id1 = refId1 + '_' +Constant.bookCodeList[parseInt(book, 10) - 1],
        id2 = refId2 + '_' + Constant.bookCodeList[parseInt(book, 10) - 1],
        i;
        return refDb.get(id1).then((doc) => {
            for (i = 0; i < doc.chapters.length; i++) {
                if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                    break;
                }
            }
            return doc.chapters[i].verses
        }).then((response) => {
            let ref1 = response;
            let i;
            return refDb.get(id2).then((doc) => {
                for ( i = 0; i < doc.chapters.length; i++) {
                    if (doc.chapters[i].chapter == parseInt(chapter, 10)) {
                        break;
                    }
                }
                let ref2 = doc.chapters[i].verses
                var refString = "";
                for (let i = 1; i <= ref1.length; i++) {
                    var d = dmp_diff.diff_main(ref1[i - 1].verse, ref2[i - 1].verse);
                    dmp_diff.diff_cleanupSemantic(d);
                    var ds = dmp_diff.diff_prettyHtml(d);
                    refString += '<div data-verse="r' + (i) + '"><span class="verse-num">' + (i) + '</span><span>' + ds + '</span></div>';
                }
                return refString;
            });
        });
    }
    

    getRefContents = (id,chapter) => {

        refDb.get('targetReferenceLayout').then((doc) => {
            AutographaStore.layout = doc.layout;
            AutographaStore.layoutContent = doc.layout;
            let chapter = AutographaStore.chapterId.toString();
            switch(doc.layout){
                case 1:
                    this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.content = content;
                    })
                    break;
                case 2:
               
                    this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.content = content;
                    }) 
                    this.getContent(AutographaStore.activeRefs[1]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.contentOne = content;
                    })
                
                    break;
                    
                case 3:
                    this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.content = content;
                    }) 
                    this.getContent(AutographaStore.activeRefs[1]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.contentOne = content;
                    })
                    this.getContent(AutographaStore.activeRefs[2]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                        AutographaStore.contentTwo = content;
                    })
                    break;
            }
        })
       //  AutographaStore.aId  = "";
        var translationContent = [];
        var i;
        var chunkIndex = 0;
        var chunkVerseStart; 
        var chunkVerseEnd;
        var chunkGroup = [];
        var chunks = AutographaStore.chunks;
        var verses = AutographaStore.verses;
        for (i = 0; i < chunks.length; i++) {
            if (parseInt(chunks[i].chp, 10) === parseInt(chapter, 10)) {
                chunkIndex = i + 1;
                chunkVerseStart = parseInt(chunks[i].firstvs, 10);
                chunkVerseEnd = parseInt(chunks[i + 1].firstvs, 10) - 1;
                break;
            }
        }

        for (i = 1; i <= verses.length; i++) {
            var spanVerseNum = '';
            if (i > chunkVerseEnd) {
                chunkVerseStart = parseInt(chunks[chunkIndex].firstvs, 10);
                if (chunkIndex === chunks.length - 1 || parseInt((chunks[chunkIndex + 1].chp), 10) != chapter) {
                    chunkVerseEnd = verses.length;
                    
                } else {
                    chunkIndex++;
                    chunkVerseEnd = parseInt(chunks[chunkIndex].firstvs, 10) - 1;
                }
            }
            var chunk = chunkVerseStart + '-' + chunkVerseEnd;
            translationContent.push(verses[i - 1].verse).toString();
            var spanVerse = chunk 
            chunkGroup.push(spanVerse);
        }

        AutographaStore.chunkGroup = chunkGroup;
        AutographaStore.translationContent= translationContent;
    }

    openpopupSettings() {
        AutographaStore.showModalSettings = true
    }

    openpopupSearch() {
        AutographaStore.showModalSearch = true
    }

    openpopupDownload() {
        AutographaStore.showModalDownload = true
    }

    exportPDF = (e, column) => {
        const currentTrans = AutographaStore.currentTrans;
        let id = AutographaStore.currentRef + '_' + Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1];
        db.get('targetBible').then((doc) => {
            db.get(AutographaStore.bookId).then((book) => {
                exportHtml.exportHtml(id, book, db, doc.langScript, column);
            })
        }).catch(function(err) {
            // handle any errors
            swal(currentTrans["dynamic-msg-error"], "Please enter Translation Details in the Settings to continue with Export.", "error");
        });  
    }

    openpopupAboutUs() {
        AutographaStore.showModalAboutUs = true
    }

    openpopupBooks(tab) {
        // event.persist();
         AutographaStore.aId = tab;
        var chap = [];
        AutographaStore.showModalBooks = true;
        AutographaStore.activeTab = tab;
        AutographaStore.bookActive = AutographaStore.bookId;
        AutographaStore.bookName = Constant.booksList[parseInt(AutographaStore.bookId, 10) - 1] 
        AutographaStore.chapterActive = AutographaStore.chapterId;
        this.getData();
    }

    getData(){
        refDb.get(AutographaStore.currentRef +"_"+ Constant.bookCodeList[parseInt(AutographaStore.bookId, 10)-1]).then(function(doc) {
            AutographaStore.bookChapter["chapterLength"] = doc.chapters.length;
            AutographaStore.bookChapter["bookId"] = AutographaStore.bookId;
        }).catch(function(err){
            console.log(err);
        })
    }

    onItemClick(bookName) {
        var bookNo;
        for (var i = 0; i < Constant.booksList.length; i++) {
            bookName == Constant.booksList[i]
            if (bookName == Constant.booksList[i]) {
                var bookNo = i+1;
                break;
            };
        };
        AutographaStore.bookActive = bookNo;
        AutographaStore.bookName = bookName;
        AutographaStore.chapterActive = 0;
        var id = AutographaStore.currentRef + '_' + Constant.bookCodeList[parseInt(bookNo, 10) - 1]
        var getData = refDb.get(id).then(function(doc) {
            return doc.chapters.length;
        }).catch(function(err){
            console.log(err);
        });
        getData.then((length) => {
            AutographaStore.bookChapter["chapterLength"] = length;
            AutographaStore.bookChapter["bookId"] = bookNo;
        });
    }

     
    handleSelect(key) {
        // this.setState({key});
    }

    goToTab(key) {
        var _this = this;
        AutographaStore.activeTab = key;
    }

    getValue(chapter, bookId){
        AutographaStore.translationContent = "";
        AutographaStore.chapterId = chapter;
        AutographaStore.bookId = bookId;
        var verses = AutographaStore.verses;
        var chunks = AutographaStore.chunks;
        this.saveLastVisit(bookId,chapter);
        const cookiechapter = { url: 'http://chapter.autographa.com', name: 'chapter' , value: chapter.toString() };
        session.defaultSession.cookies.set(cookiechapter, (error) => {
            if (error)
            console.log(error);
        });

        const cookieRef = { url: 'http://book.autographa.com', name: 'book' , value: bookId.toString() };
        session.defaultSession.cookies.set(cookieRef, (error) => {
            if (error)
            console.log(error);
        });

        session.defaultSession.cookies.get({ url: 'http://refs.autographa.com' }, (error, refCookie) => {
            if(refCookie.length > 0){
                var that = this;   
                var chapter;
                var bkId = AutographaStore.bookId.toString();
                db.get(bkId).then(function(doc) {
                    refDb.get('refChunks').then(function(chunkDoc) {
                    AutographaStore.verses = doc.chapters[parseInt(AutographaStore.chapterId, 10) - 1].verses;
                    AutographaStore.chunks = chunkDoc.chunks[parseInt(AutographaStore.bookId, 10) - 1];
                    chapter = AutographaStore.chapterId;
                    that.getRefContents(AutographaStore.refId+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter.toString());
                    
                });
            })
            }else{
                var that = this; 
                var bkId = AutographaStore.bookId.toString();  
                var chapter;
                AutographaStore.bookName = Constant.booksList[parseInt(AutographaStore.bookId, 10) - 1] 
                db.get(bkId).then(function(doc) {
                    console.log("else called")
                    refDb.get('refChunks').then(function(chunkDoc) {
                    AutographaStore.verses = doc.chapters[parseInt(AutographaStore.chapterId, 10) - 1].verses;
                    AutographaStore.chunks = chunkDoc.chunks[parseInt(AutographaStore.bookId, 10) - 1];
                    chapter = AutographaStore.chapterId;
                    that.getRefContents('eng_ulb'+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter.toString());
                });
            })
            }    
        })
        AutographaStore.showModalBooks = false;
    }

    saveLastVisit(book, chapter) {
        refDb.get('ref_history').then(function(doc) {
            doc.visit_history = [{ "book": AutographaStore.bookName, "chapter": chapter, "bookId": book }]
            refDb.put(doc).then(function(response) {}).catch(function(err) {
            console.log(err);
            });
        });
    }

    getbookCategory(booksstart, booksend) {
        var booksCategory = [];
        for (var i = booksstart; i <= booksend; i++) {
            booksCategory.push(Constant.booksList[i]);
        };
        AutographaStore.bookData = booksCategory;
    }
    formatDate = (date) => {
      let monthNames = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "June", "July",
        "Aug", "Sep", "Oct",
        "Nov", "Dec"
      ];

      let day = date.getDate();
      let monthIndex = date.getMonth();
      let year = date.getFullYear();
      let hours = date.getHours();
      let seconds = date.getSeconds();
      let minutes = date.getMinutes();
      minutes = minutes < 10 ? '0'+minutes : minutes;

      return hours+ ':' + minutes  
    }

    saveTarget = () => {
        let bookNo = AutographaStore.bookId.toString();
        let that = this;
        let translationContent = [];
        db.get(bookNo).then((doc) => {
            let verses = doc.chapters[parseInt(AutographaStore.chapterId, 10) - 1].verses;
            verses.forEach( (verse, index) => {
                let vId = 'v' + (index + 1);
                verse.verse = document.getElementById(vId).textContent;
                doc.chapters[parseInt(AutographaStore.chapterId, 10) - 1].verses = verses;
            });
            db.get(doc._id).then((book) => {
                doc._rev = book._rev;
                db.put(doc).then((response) => {
                    let dateTime = new Date();
                    AutographaStore.transSaveTime = that.formatDate(dateTime);
                    clearInterval("#saved-time");
                }, (err) => {
                    db.put(doc).then((response) => {
                        let dateTime = new Date();
                        AutographaStore.transSaveTime = that.formatDate(dateTime)
                    },(err) => {
                        clearInterval("#saved-time");
                    });
                    clearInterval("#saved-time");
                });
            });
           
           
        }, (err) => {
            console.log('Error: While retrieving document. ' + err);
        });
    }

    handleRefChange(refDropDownPos, event) {
        // event.persist();
        AutographaStore.activeRefs[refDropDownPos] = event.target.value;
        refDb.get('activeRefs').then((doc) => {
            doc._rev = doc._rev;
            doc.activeRefs = Object.assign(doc.activeRefs, AutographaStore.activeRefs);
            refDb.put(doc);
        }, (err) => {
            refDb.put({_id: "activeRefs" , activeRefs: activeRefs}).then((res) => {
            }, (err) => {
                console.log(err);
            });
        });
        AutographaStore.selectId = event.target.id;
        AutographaStore.layoutContent = parseInt(event.currentTarget.dataset.layout);
        let referenceValue = event.target.value;
        AutographaStore.currentRef = referenceValue;
        session.defaultSession.cookies.get({ url: 'http://book.autographa.com' }, (error, bookCookie) => {
            if(bookCookie.length > 0){
                this.getRefContents(referenceValue+'_'+Constant.bookCodeList[parseInt(bookCookie[0].value, 10) - 1],AutographaStore.chapterId) 
            }else{
                this.getRefContents(referenceValue+'_'+Constant.bookCodeList[parseInt('1', 10) - 1],AutographaStore.chapterId)
            }    
        })
        var cookieRef = { url: 'http://refs.autographa.com', name: '0' , value: event.target.value };
        session.defaultSession.cookies.set(cookieRef, (error) => {
            if (error)
            console.log(error);
        });

    }
    setDiff = (e, toggled) => {
            refDb.get('targetReferenceLayout').then((doc) => {
                AutographaStore.layout = doc.layout;
                AutographaStore.layoutContent = doc.layout;
                let chapter = AutographaStore.chapterId.toString();
                const transDiffRef = doc.layout -1;
                switch(doc.layout){
                    case 1:
                    if(toggled){
                        this.getDiffText(AutographaStore.activeRefs[0], AutographaStore.activeRefs[1], AutographaStore.bookId, chapter).then((content)=>{
                            AutographaStore.contentOne = content;
                        })
                    }
                    else {
                        this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.content = content;
                        })
                    }
                        break;
                    case 2:
                    if(toggled){
                        this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.content = content;
                        })
                        this.getDiffText(AutographaStore.activeRefs[0], AutographaStore.activeRefs[1], AutographaStore.bookId, chapter).then((content)=>{
                            AutographaStore.contentOne = content;
                        })
    
                    }else{
                        this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.content = content;
                        }) 
                        this.getContent(AutographaStore.activeRefs[1]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.contentOne = content;
                        })
                    }
                        break;
                        
                    case 3:
                    if(toggled){
                        this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.content = content;
                        }) 
                        this.getDiffText(AutographaStore.activeRefs[0], AutographaStore.activeRefs[1], AutographaStore.bookId, chapter).then((content)=>{
                            AutographaStore.contentOne = content;
                        })
                        this.getDiffText(AutographaStore.activeRefs[1], AutographaStore.activeRefs[2], AutographaStore.bookId, chapter).then((content)=>{
                            AutographaStore.contentTwo= content;
                        })
                    }else{
                        this.getContent(AutographaStore.activeRefs[0]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.content = content;
                        }) 
                        this.getContent(AutographaStore.activeRefs[1]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.contentOne = content;
                        })
                        this.getContent(AutographaStore.activeRefs[2]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1],chapter).then((content)=>{
                            AutographaStore.contentTwo = content;
                        })
                    }
                    break;
                }
            })
           //  AutographaStore.aId  = "";
            var translationContent = [];
            var i;
            var chunkIndex = 0;
            var chunkVerseStart; 
            var chunkVerseEnd;
            var chunkGroup = [];
            var chunks = AutographaStore.chunks;
            var verses = AutographaStore.verses;
            var chapter = AutographaStore.chapterId;
            for (i = 0; i < chunks.length; i++) {
                if (parseInt(chunks[i].chp, 10) === parseInt(chapter, 10)) {
                    chunkIndex = i + 1;
                    chunkVerseStart = parseInt(chunks[i].firstvs, 10);
                    chunkVerseEnd = parseInt(chunks[i + 1].firstvs, 10) - 1;
                    break;
                }
            }
            db.get(AutographaStore.bookId).then((targetDoc) => {
                let id = AutographaStore.activeRefs[AutographaStore.layout-1]+'_'+Constant.bookCodeList[parseInt(AutographaStore.bookId, 10) - 1]
                refDb.get(id).then(function(refdoc) {
                    for (i = 0; i < refdoc.chapters.length; i++) {
                        if (refdoc.chapters[i].chapter == parseInt(chapter, 10)) {
                            break;
                        }
                    }
                    let book_verses = refdoc.chapters[i].verses
                    for (i = 1; i <= verses.length; i++) {
                        var spanVerseNum = '';
                        if (i > chunkVerseEnd) {
                            chunkVerseStart = parseInt(chunks[chunkIndex].firstvs, 10);
                            if (chunkIndex === chunks.length - 1 || parseInt((chunks[chunkIndex + 1].chp), 10) != chapter) {
                                chunkVerseEnd = verses.length;
                                
                            } else {
                                chunkIndex++;
                                chunkVerseEnd = parseInt(chunks[chunkIndex].firstvs, 10) - 1;
                            }
                        }
                        let chunk = chunkVerseStart + '-' + chunkVerseEnd;
                        if(toggled){
                            let verseDiff = dmp_diff.diff_main(targetDoc.chapters[parseInt(chapter, 10) - 1].verses[i - 1].verse, book_verses[i - 1].verse);
                            dmp_diff.diff_cleanupSemantic(verseDiff);
                            let ds = dmp_diff.diff_prettyHtml(verseDiff);
                            translationContent.push(ds).toString();
                        }else{
                            translationContent.push(verses[i - 1].verse).toString();
                        }
                        chunkGroup.push(chunk);
                    }
                    AutographaStore.chunkGroup = chunkGroup;
                    AutographaStore.translationContent= translationContent;
                }).catch(function(err) {
                    console.log(err);
                });
                    
                
            })
            
        
    }
    
    render() {
        // const layout = AutographaStore.layout;
        var OTbooksstart = 0;
        var OTbooksend = 38;
        var NTbooksstart= 39;
        var NTbooksend= 65;
        const bookData = AutographaStore.bookData;
        const refContent = AutographaStore.content; 
        const refContentOne = AutographaStore.contentOne;
        const refContentCommon = AutographaStore.contentCommon;
        const refContentTwo = AutographaStore.contentTwo;
        const bookName = Constant.booksList[parseInt(AutographaStore.bookId, 10) - 1]
        let close = () => AutographaStore.showModalBooks = false;
        const test = (AutographaStore.activeTab == 1);
        var chapterList = [];
        for(var i=0; i<AutographaStore.bookChapter["chapterLength"]; i++){
            chapterList.push( <li key={i} value={i+1} ><a href="#"  className={(i+1 == AutographaStore.chapterActive) ? 'link-active': ""} onClick = { this.getValue.bind(this,  i+1, AutographaStore.bookChapter["bookId"]) } >{(i+1)}</a></li> );
        }
        return (
            <div>
                <Modal show={AutographaStore.showModalBooks} onHide = {close} id="tab-books">
                    <Modal.Header closeButton>
                        <Modal.Title>Book and Chapter</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Tabs 
                            animation={false}
                            activeKey={AutographaStore.activeTab}
                            onSelect={() =>this.goToTab(AutographaStore.activeTab == 1? 2 : 1)} id="noanim-tab-example">
                            {
                                test ? (
                                <div className="wrap-center">
                                    <div className="btn-group" role="group" aria-label="...">
                                        <button 
                                            className="btn btn-primary" 
                                            type="button"
                                            id="allBooksBtn"
                                            data-toggle="tooltip"
                                            data-placement="bottom" 
                                            title=""
                                            onClick={ this.getbookCategory.bind(this, OTbooksstart, NTbooksend) }
                                            data-original-title="All">
                                            ALL
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            type="button"
                                            id="otBooksBtn" 
                                            data-toggle="tooltip" 
                                            data-placement="bottom"
                                            title=""
                                            onClick={ this.getbookCategory.bind(this, OTbooksstart, OTbooksend) }
                                            data-original-title="Old Testament">
                                            OT
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            type="button"
                                            id="ntBooksBtn"
                                            data-toggle="tooltip"
                                            data-placement="bottom"
                                            title=""
                                            onClick={ this.getbookCategory.bind(this, NTbooksstart, NTbooksend) }
                                            data-original-title="New Testament">
                                            NT
                                        </button>
                                    </div>          
                                </div>
                                 ) : ''
                            }
                            <Tab eventKey={1} title="Book" onClick={() => this.goToTab(2)}>
                                <div className="wrap-center"></div>
                                <div className="row books-li" id="bookdata">
                                    <ul id="books-pane">
                                        {
                                            bookData.map((item,index) =>{
                                            return <li key={index}>
                                                        <a href="#" key={index} onClick={ this.onItemClick.bind(this, item) }
                                                            value={item} className={( AutographaStore.bookName == item ) ? 'link-active': ""} >
                                                            {item}
                                                        </a>
                                                    </li>
                                            })
                                        }                       
                                    </ul>
                                </div>
                                <div className= "clearfix"></div>
                            </Tab>
                            <Tab eventKey={2} title="Chapters" > 
                                <div className="chapter-no">
                                    <ul id="chaptersList">
                                    { chapterList }
                                    </ul>
                                </div>
                            </Tab>
                        </Tabs>
                    </Modal.Body>
                </Modal>
                <SettingsModal show={AutographaStore.showModalSettings} />
                <AboutUsModal show={AutographaStore.showModalAboutUs} />
                <SearchModal show={AutographaStore.showModalSearch}/>
                <DownloadModal show={AutographaStore.showModalDownload} />
                <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
                    <div className="container-fluid">
                    <div className="navbar-header">
                        <button
                            className="navbar-toggle collapsed"
                            type="button"
                            data-toggle="collapse"
                            data-target="#navbar"
                            aria-expanded="false"
                            aria-controls="navbar">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </button>
                        <a href="javascript:;" className="navbar-brand" ><img alt="Brand" src="../assets/images/logo.png"/></a>
                    </div>
                    <div className="navbar-collapse collapse" id="navbar">
                        <ul className="nav navbar-nav" style={{padding: "3px 0 0 0px"}}>
                            <li>
                                <div 
                                    className="btn-group navbar-btn strong verse-diff-on"
                                    role="group"
                                    aria-label="..."
                                    id="bookBtn"
                                    style={{marginLeft:"200px"}}>
                                    <a
                                        onClick={() => this.openpopupBooks(1)}
                                        href="#"
                                        className="btn btn-default"
                                        data-toggle="tooltip"
                                        data-placement="bottom"
                                        title="Select Book"
                                        id="book-chapter-btn"
                                    >
                                    {bookName}
                                    </a>
                                    <span id="chapterBtnSpan">
                                        <a onClick={() => this.openpopupBooks(2)} className="btn btn-default" id="chapterBtn" data-target="#myModal"  data-toggle="modal" data-placement="bottom"  title="Select Chapter" >{(AutographaStore.chapterId)}
                                        </a>
                                    </span>
                                </div>                               
                            </li>
                        </ul>
                        <ul className="nav navbar-nav navbar-right nav-pills verse-diff-on">
                            <li style={{padding: "17px 5px 0 0", color: "#fff", fontWeight: "bold"}}><span><FormattedMessage id="btn-switch-off" /></span></li>
                            <li>

                                <FormattedMessage id="tooltip-compare-mode">
                                    {(message) =>
                                        <Toggle
                                          defaultToggled={false}
                                          style={{marginTop:"17px"}}
                                          onToggle = {this.setDiff}
                                          
                                        />
                                    }
                                </FormattedMessage>                               
                            </li>
                            <li style={{padding:"17px 0 0 0", color: "#fff", fontWeight: "bold"}}><span><FormattedMessage id="btn-switch-on" /></span></li>
                           
                            <li>
                                <FormattedMessage id="tooltip-find-and-replace">
                                {(message) =>
                                <a onClick={() => this.openpopupSearch()} href="javascript:;" data-toggle="tooltip" data-placement="bottom" title={message} id="searchText">
                                <i className="fa fa-search fa-2x"></i>
                                </a>}
                                </FormattedMessage>
                            </li>
                            <li>
                                <a href="#" className="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i className="fa fa-cloud-download fa-2x"></i>
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                    <li>
                                        <a onClick={() => this.openpopupDownload()} href="javascript:;"><FormattedMessage id="export-usfm"/></a>
                                    </li>
                                    <li>
                                        <a onClick={(e) => this.exportPDF(e, 1)} href="javascript:;"><FormattedMessage id="export-html-1-column"/></a>
                                        <a onClick={(e) => this.exportPDF(e, 2)} href="javascript:;"><FormattedMessage id="export-html-2-column"/></a>
                                        
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <FormattedMessage id="tooltip-about" >
                                {(message) =>
                                <a onClick={() => this.openpopupAboutUs()} href="#" data-target="#aboutmodal" data-toggle="tooltip" data-placement="bottom" title={message} id="btnAbout"><i className="fa fa-info fa-2x"></i></a>}
                                </FormattedMessage>
                            </li>
                            <li>
                                <FormattedMessage id="tooltip-settings" >
                                {(message) =>
                                <a onClick={() => this.openpopupSettings()} href="javascript:;" id="btnSettings" data-target="#bannerformmodal" data-toggle="tooltip" data-placement="bottom" title={message}><i className="fa fa-cog fa-2x"></i>
                                </a>}
                                </FormattedMessage>
                            </li>
                        </ul>
                    </div>
                    </div>
                </nav>
                {
                    AutographaStore.layout == 1   &&
                        <div className="parentdiv">
                            <div className="layoutx"> <Reference onClick={this.handleRefChange.bind(this, 0)} refIds={AutographaStore.activeRefs[0]} id = {1} layout={1}/><ReferencePanel refContent ={refContent}  /></div>
                            <div style={{padding: "10px"}} className="layoutx"><TranslationPanel onSave={this.saveTarget} /></div>
                        </div>
                } 
                {
                    AutographaStore.layout == 2 &&
                    <div className="parentdiv">
                        <div className="layout2x"><Reference onClick={this.handleRefChange.bind(this, 0)} refIds={AutographaStore.activeRefs[0]} id={21} layout = {1} /><ReferencePanel refContent ={refContent} refIds={AutographaStore.activeRefs[0]} /></div>

                        <div className="layout2x"><Reference onClick={this.handleRefChange.bind(this, 1)} refIds={AutographaStore.activeRefs[1]} id={22} layout = {2} /><ReferencePanel refContent ={refContentOne} refIds={AutographaStore.activeRefs[1]}/></div>
                        <div style={{padding: "10px"}} className="layout2x"><TranslationPanel onSave={this.saveTarget} /></div>
                    </div>
                }
                {
                    AutographaStore.layout == 3 &&
                    <div className="parentdiv">
                        <div className="layout3x"><Reference onClick={this.handleRefChange.bind(this, 0)} refIds={AutographaStore.activeRefs[0]} id={31} layout = {1} /><ReferencePanel refContent ={refContent} refIds={AutographaStore.activeRefs[0]}/></div>

                        <div className="layout3x"><Reference onClick={this.handleRefChange.bind(this, 1)} refIds={AutographaStore.activeRefs[1]} id={32} layout = {2} /><ReferencePanel refContent ={refContentOne} refIds={AutographaStore.activeRefs[1]}/></div>

                        <div className="layout3x"><Reference onClick={this.handleRefChange.bind(this, 2)} refIds={AutographaStore.activeRefs[2]} id={33} layout = {3} /><ReferencePanel refContent ={refContentTwo} refIds={AutographaStore.activeRefs[2]}/></div>
                        <div style={{ padding: "10px"}} className="layout3x"><TranslationPanel onSave={this.saveTarget} /></div>
                    </div>
                }  
                <Footer onSave={this.saveTarget} getRef = {this.getRefContents}/>
            </div>
        )
    }
}
module.exports = Navbar;
