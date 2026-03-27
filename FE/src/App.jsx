import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/clientPage/HomePage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminLayout from "./layouts/AdminLayout";
import UserListPage from "./pages/adminPage/UserListPage";
import UserCreatePage from "./pages/adminPage/UserCreatePage";
import UserEditPage from "./pages/adminPage/UserEditPage";
import UserSelfUpdatePage from "./pages/adminPage/UserSelfUpdatePage";
import CategoryListPage from "./pages/adminPage/CategoryListPage";
import CategoryCreatePage from "./pages/adminPage/CategoryCreatePage";
import CategoryUpdatePage from "./pages/adminPage/CategoryUpdatePage";
import SubCategoryListPage from "./pages/adminPage/SubCategoryListPage";
import SubCategoryCreatePage from "./pages/adminPage/SubCategoryCreatePage";
import SubCategoryUpdatePage from "./pages/adminPage/SubCategoryUpdatePage";
import CreatePostPage from "./pages/adminPage/PostCreatePage";
import CategoryPage from "./pages/clientPage/CategoryPage";
import SubCategoryPage from "./pages/clientPage/SubCategoryPage";
import PostPage from "./pages/clientPage/PostPage";
import PostListPage from "./pages/adminPage/PostListPage";
import PostUpdatePage from "./pages/adminPage/PostUpdatePage";
import AdminOnlyRoute from "./components/AdminOnlyRoute";
import InfoCreatePage from "./pages/adminPage/InfoCreatePage";
import InfoListPage from "./pages/adminPage/InfoListPage";
import InfoUpdatePage from "./pages/adminPage/InfoUpdatePage";
import BannerCreatePage from "./pages/adminPage/BannerCreatePage";
import BannerListPage from "./pages/adminPage/BannerListPage";
import BannerUpdatePage from "./pages/adminPage/BannerUpdatePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang có dùng MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/Homepage" />} />
          <Route path="/Homepage" element={<HomePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/:categorySlug" element={<CategoryPage />} />
          <Route path="/:categorySlug/:subcategorySlug" element={<SubCategoryPage />} />
          <Route path="/:categorySlug/:subcategorySlug/:postSlug" element={<PostPage />} />
        </Route>
        
        {/* Các trang có dùng AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<div />} />
          <Route path="/user/update" element={<UserSelfUpdatePage />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="/user/list" element={<UserListPage />} />
            <Route path="/user/create" element={<UserCreatePage />} />
            <Route path="/user/edit/:id" element={<UserEditPage />} />
            <Route path="/user/update/:id" element={<UserEditPage />} />
          </Route>

          <Route path="/category/list" element={<CategoryListPage />} />
          <Route path="/category/create" element={<CategoryCreatePage />} />
          <Route path="/category/update/:id" element={<CategoryUpdatePage />} />

          <Route path="/subcategory/list" element={<SubCategoryListPage />} />
          <Route path="/subcategory/create" element={<SubCategoryCreatePage />} />
          <Route path="/subcategory/update/:id" element={<SubCategoryUpdatePage />} />
          
          <Route path="/post/create" element={<CreatePostPage />} />
          <Route path="/post/list" element={<PostListPage />} />
          <Route path="/post/update/:id" element={<PostUpdatePage />} />
          
          <Route path="/info/create" element={<InfoCreatePage />} />
          <Route path="/info/list" element={<InfoListPage />} />
          <Route path="/info/update/:id" element={<InfoUpdatePage />} /> 

          <Route path="/banner/list" element={<BannerListPage />} />
          <Route path="/banner/create" element={<BannerCreatePage />} /> 
          <Route path="/banner/update/:id" element={<BannerUpdatePage />} />
        </Route>

        {/* Trang login để riêng, thường không cần header/footer */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}