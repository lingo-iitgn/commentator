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
import Intermediate from './Home/Intermediate';
import Tasks from './Home/Tasks';
import POS from './POS/POS';
import Matrix from './Matrix/Matrix';
import Profile from './User/Profile';
import Profile1 from './User/Profile1';
import Edit from './Edit/Edit';
import POSEDIT from './Edit/Pos-edit.js';


const Router = () => {
    const history = createBrowserHistory();

    return (
        <BrowserRouter history={history}>
            <Routes>
                <Route path="/login" exact element={<Login />} />
                <Route path="/signup" exact element={<Signup />} />
                {/* <Route path="/" exact element={<ProtectedRoute />}>
                    <Route exact path='/intermediate' element={<Intermediate/>}/>
                </Route> */}
                <Route path="/admin" exact element={<AdminRoute />}>
                    <Route exact path='/admin' element={<Admin/>}/>
                </Route>
                <Route path="/" exact element={<ProtectedRoute />}>
                    <Route exact path='/profile' element={<Profile/>}/>
                    <Route exact path='/profile1' element={<Profile1/>}/>
                    <Route exact path='/edit/:sid' element={<Edit/>}/>
                    <Route exact path='/edit1/:posid' element={<POSEDIT/>}/>
                    <Route exact path='/pos' element={<POS/>}/>
                    <Route exact path='/matrix' element={<Matrix/>}/>
                    <Route exact path='/tasks' element={<Tasks/>}/>
                    <Route exact path='/intermediate' element={<Intermediate/>}/>
                    <Route exact path='/' element={<Home/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default Router;