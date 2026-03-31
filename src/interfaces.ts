export interface SignUpBody {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface otpBody {
  email: string;
  otp: string;
}

export interface loginBody {
  email: string;
  password: string;
}
