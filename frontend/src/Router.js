// import React from 'react';
// import { BrowserRouter } from 'react-router-dom';
// import { Route, Routes } from 'react-router';
// import { createBrowserHistory } from 'history';

// // PAGES
// import Login from './Auth/Login';
// import Signup from './Auth/Signup';
// import Home from './Home/Home';
// import Admin from './Admin/Admin';

// // COMPONENTS
// import ProtectedRoute from './utils/ProtectedRoute';
// import AdminRoute from './utils/AdminRoute';
// import Tasks from './Home/Tasks';
// import POS from './POS/POS';
// import Matrix from './Matrix/Matrix';
// import NER from './NER/NER';
// import Profile from './User/Profile';
// import Profilepos from './User/Profile-pos';
// import Profilematrix from './User/Profile-matrix';
// import Profilener from './User/Profile-ner';
// import Profiletranslate from './User/Profile-translate';
// import Edit from './Edit/Edit';
// import MatrixEdit from './Edit/Matrix-edit';
// import POSEDIT from './Edit/Pos-edit.js';
// import NEREDIT from './Edit/ner-edit';
// import TRANSLATEEDIT from './Edit/Translate-edit';
// import Translation from './Translate/Translate';

// const Router = () => {
//     const history = createBrowserHistory();

//     return (
//         <BrowserRouter history={history}>
//             <Routes>
//                 <Route path="/login" exact element={<Login />} />
//                 <Route path="/signup" exact element={<Signup />} />
//                 <Route path="/admin" exact element={<AdminRoute />}>
//                     <Route exact path='/admin' element={<Admin/>}/>
//                 </Route>
//                 <Route path="/" exact element={<ProtectedRoute />}>
//                     <Route exact path='/profile' element={<Profile/>}/>
//                     <Route exact path='/Profilepos' element={<Profilepos/>}/>
//                     <Route exact path='/Profilematrix' element={<Profilematrix/>}/>
//                     <Route exact path='/Profilener' element={<Profilener/>}/>
//                     <Route exact path='/Profiletranslate' element={<Profiletranslate/>}/>
//                     <Route exact path='/edit/:sid' element={<Edit/>}/>
//                     <Route exact path='/mat-edit/:matid' element={<MatrixEdit/>}/>
//                     <Route exact path='/edit1/:posid' element={<POSEDIT/>}/>
//                     <Route exact path='/ner-edit/:nerid' element={<NEREDIT/>}/>
//                     <Route exact path='/trans-edit/:transid' element={<TRANSLATEEDIT/>}/>
//                     <Route exact path='/pos' element={<POS/>}/>
//                     <Route exact path='/ner' element={<NER/>}/>
//                     <Route exact path='/matrix' element={<Matrix/>}/>
//                     <Route exact path='/translate' element={<Translation/>}/>
//                     <Route exact path='/tasks' element={<Tasks/>}/>
//                     <Route exact path='/' element={<Home/>}/>
//                 </Route>
//             </Routes>
//         </BrowserRouter>
//     );
// };

// export default Router;



import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router';
import { createBrowserHistory } from 'history';

// PAGES
import Login from './Auth/Login';
import Signup from './Auth/Signup';
import Home from './Home/Home';
import Admin from './Admin/Admin';

// COMPONENTS
import ProtectedRoute from './utils/ProtectedRoute';
import AdminRoute from './utils/AdminRoute';
import Tasks from './Home/Tasks';
import POS from './POS/POS';
import Matrix from './Matrix/Matrix';
import NER from './NER/NER';
import SCN from './SCN/SCN'
import Profile from './User/Profile';
import Profilepos from './User/Profile-pos';
import Profilematrix from './User/Profile-matrix';
import Profilener from './User/Profile-ner';
import Profiletranslate from './User/Profile-translate';
import Profilescn from './User/Profile-scn'
import Edit from './Edit/Edit';
import MatrixEdit from './Edit/Matrix-edit';
import POSEDIT from './Edit/Pos-edit.js';
import NEREDIT from './Edit/ner-edit';
import TRANSLATEEDIT from './Edit/Translate-edit';
import SCNEDIT from './Edit/Scn-edit'
import Translation from './Translate/Translate';

const Router = () => {
    const history = createBrowserHistory();

    return (
        <BrowserRouter history={history}>
            <Routes>
                <Route path="/login" exact element={<Login />} />
                <Route path="/signup" exact element={<Signup />} />
                <Route path="/admin" exact element={<AdminRoute />}>
                    <Route exact path='/admin' element={<Admin/>}/>
                </Route>
                <Route path="/" exact element={<ProtectedRoute />}>
                    <Route exact path='/profile' element={<Profile/>}/>
                    <Route exact path='/Profilepos' element={<Profilepos/>}/>
                    <Route exact path='/Profilematrix' element={<Profilematrix/>}/>
                    <Route exact path='/Profilener' element={<Profilener/>}/>
                    <Route exact path='/Profiletranslate' element={<Profiletranslate/>}/>
                    <Route exact path='/Profilescn' element={<Profilescn/>}/>
                    <Route exact path='/edit/:sid' element={<Edit/>}/>
                    <Route exact path='/mat-edit/:matid' element={<MatrixEdit/>}/>
                    <Route exact path='/edit1/:posid' element={<POSEDIT/>}/>
                    <Route exact path='/ner-edit/:nerid' element={<NEREDIT/>}/>
                    <Route exact path='/trans-edit/:transid' element={<TRANSLATEEDIT/>}/>
                    <Route exact path='/scn-edit/:scnid' element={<SCNEDIT/>}/>
                    <Route exact path='/pos' element={<POS/>}/>
                    <Route exact path='/ner' element={<NER/>}/>
                    <Route exact path='/matrix' element={<Matrix/>}/>
                    <Route exact path='/translate' element={<Translation/>}/>
                    <Route exact path='/scn' element={<SCN/>}/>
                    <Route exact path='/tasks' element={<Tasks/>}/>
                    <Route exact path='/' element={<Home/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default Router;