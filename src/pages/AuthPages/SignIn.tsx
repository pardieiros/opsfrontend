import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Plasticos Dão OPS"
        description="This page is for workers of the company Plasticos Dão"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
