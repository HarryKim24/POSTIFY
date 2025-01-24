/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: {
    url: string;
    public_id: string;
  } | null;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get('/auth/me');
        setUser(response.data.user);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setMessage('세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.clear();
          navigate('/login');
        } else {
          setMessage(error.response?.data?.error || '사용자 정보를 가져올 수 없습니다.');
        }
      }
    };
    fetchUser();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImage(e.target.files?.[0] || null);
  };

  const handleImageUpload = async () => {
    if (!profileImage) return alert('이미지를 선택해주세요.');

    const formData = new FormData();
    formData.append('image', profileImage);

    try {
      const uploadResponse = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = uploadResponse.data.imageUrl;

      await API.put('/auth/me', { profileImage: imageUrl });
      setUser((prev) => (prev ? { ...prev, profileImage: imageUrl } : prev));
      setMessage('프로필 이미지가 성공적으로 업데이트되었습니다.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || '이미지 업로드 중 문제가 발생했습니다.');
    } finally {
      setProfileImage(null);
    }
  };

  return (
    <div>
      <h1>프로필</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}
      {user ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            {user.profileImage?.url ? (
              <img
                src={user.profileImage.url}
                alt="프로필 이미지"
                style={{
                  maxWidth: '50px',
                  maxHeight: '50px',
                  borderRadius: '50%',
                  marginRight: '10px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#ccc',
                  marginRight: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p>
                <strong>사용자 이름:</strong> {user.username}
              </p>
              <p>
                <strong>이메일:</strong> {user.email}
              </p>
            </div>
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button onClick={handleImageUpload} disabled={!profileImage}>
              이미지 업로드
            </button>
          </div>
        </div>
      ) : (
        !message && <p>로딩 중...</p>
      )}
    </div>
  );
};

export default ProfilePage;
