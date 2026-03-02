import React from 'react';

export const metadata = {
  title: 'LuminSight - 개인정보처리방침',
  description: 'LuminSight 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: '#f5f4fa', minHeight: '100vh', padding: '40px 0' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '40px', paddingBottom: '40px' }}>
        <h1 style={{ color: '#18162a', fontWeight: 800, fontSize: '32px', marginBottom: '32px' }}>
          개인정보처리방침
        </h1>

        <div style={{ fontSize: '14px', color: '#8b7fd4', marginBottom: '32px' }}>
          시행일: 2026년 3월 1일
        </div>

        {/* 제1조 개요 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제1조 개요
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              LuminSight(이하 "회사")는 개인정보 보호법을 준수하며, 사용자의 개인정보를 안전하게 관리합니다. 본 방침은 LuminSight 서비스를 이용하는 과정에서 발생하는 개인정보 수집, 이용, 보관, 폐기 등에 관한 사항을 설명합니다.
            </p>
          </div>
        </section>

        {/* 제2조 수집하는 개인정보 항목 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제2조 수집하는 개인정보 항목
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              회사는 다음과 같은 개인정보를 수집합니다:
            </p>
            <div style={{ marginLeft: '0', marginBottom: '16px' }}>
              <h3 style={{ color: '#18162a', fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
                필수 수집 항목
              </h3>
              <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  이메일 주소
                </li>
                <li style={{ marginBottom: '8px' }}>
                  비밀번호 (암호화하여 저장)
                </li>
                <li style={{ marginBottom: '8px' }}>
                  가입 시 입력한 이름 또는 닉네임
                </li>
              </ul>
            </div>
            <div style={{ marginLeft: '0', marginBottom: '0' }}>
              <h3 style={{ color: '#18162a', fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
                자동 수집 항목
              </h3>
              <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  웹사이트 방문 기록 및 접속 로그
                </li>
                <li style={{ marginBottom: '8px' }}>
                  IP 주소 및 브라우저 정보
                </li>
                <li style={{ marginBottom: '8px' }}>
                  쿠키 및 유사 추적 기술을 통한 사용자 행동 정보
                </li>
                <li style={{ marginBottom: '8px' }}>
                  서비스 이용 시간, 이용 기능, 검색 키워드 등의 이용 기록
                </li>
                <li style={{ marginBottom: '8px' }}>
                  포트폴리오 설정값 및 관심 종목 정보
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제3조 개인정보 수집 목적 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제3조 개인정보 수집 목적
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              수집된 개인정보는 다음 목적으로만 사용됩니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                회원 가입 및 계정 관리
              </li>
              <li style={{ marginBottom: '8px' }}>
                서비스 제공 및 개선
              </li>
              <li style={{ marginBottom: '8px' }}>
                사용자 맞춤형 기능 제공 (포트폴리오 관리, 관심 종목 추적 등)
              </li>
              <li style={{ marginBottom: '8px' }}>
                고객 지원 및 문의 응대
              </li>
              <li style={{ marginBottom: '8px' }}>
                서비스 통계 분석 및 이용 현황 파악
              </li>
              <li style={{ marginBottom: '8px' }}>
                법적 의무 이행
              </li>
            </ul>
          </div>
        </section>

        {/* 제4조 개인정보 보유 기간 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제4조 개인정보 보유 기간
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              개인정보는 다음과 같은 기간 동안 보유됩니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>회원 정보:</span> 회원 탈퇴 시까지 보유하며, 탈퇴 후 관련 법령에서 요구하는 기간만큼 보유
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>이용 기록:</span> 3년 보유
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>로그인 기록:</span> 1년 보유
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>포트폴리오 데이터:</span> 사용자 요청 시까지 보유, 탈퇴 또는 삭제 요청 시 지체 없이 삭제
              </li>
            </ul>
          </div>
        </section>

        {/* 제5조 제3자 제공 및 공유 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제5조 제3자 제공 및 공유
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              <span style={{ color: '#8b7fd4', fontWeight: 700 }}>원칙적 미제공:</span> 회사는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              다만, 다음의 경우에는 예외입니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                사용자의 명시적 동의가 있는 경우
              </li>
              <li style={{ marginBottom: '8px' }}>
                법령에서 요구하는 경우 (예: 법원의 명령, 수사 기관의 요청)
              </li>
              <li style={{ marginBottom: '8px' }}>
                서비스 제공을 위해 필요한 협력사 (결제 처리, 호스팅 제공자 등)에게만 최소한의 정보 제공 (이 경우 협력사는 개인정보 보호 계약을 통해 동일한 수준의 보호를 약속함)
              </li>
            </ul>
          </div>
        </section>

        {/* 제6조 개인정보 보안 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제6조 개인정보 보안
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              회사는 다음과 같은 보안 조치를 취합니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                SSL/TLS 암호화 통신 적용
              </li>
              <li style={{ marginBottom: '8px' }}>
                비밀번호 해싱 및 암호화
              </li>
              <li style={{ marginBottom: '8px' }}>
                접근 권한 제한 및 최소 권한 원칙 적용
              </li>
              <li style={{ marginBottom: '8px' }}>
                정기적인 보안 업데이트 및 취약점 점검
              </li>
              <li style={{ marginBottom: '8px' }}>
                데이터 백업 및 재해 복구 계획 수립
              </li>
            </ul>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginTop: '16px' }}>
              다만, 인터넷을 통한 데이터 전송은 100% 안전할 수 없으므로, 회사는 절대적인 보안을 보장할 수 없습니다.
            </p>
          </div>
        </section>

        {/* 제7조 이용자의 권리 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제7조 이용자의 권리
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              사용자는 언제든지 다음의 권리를 행사할 수 있습니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                자신의 개인정보 조회, 수정, 삭제 요청
              </li>
              <li style={{ marginBottom: '8px' }}>
                개인정보 처리 동의 철회 (회원 탈퇴)
              </li>
              <li style={{ marginBottom: '8px' }}>
                개인정보의 처리 제한 요청
              </li>
              <li style={{ marginBottom: '8px' }}>
                개인정보의 이동권 (다른 서비스로의 데이터 이전)
              </li>
            </ul>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginTop: '16px' }}>
              위 요청을 하려면 privacy@luminsight.app으로 문의하시거나, 서비스 내 설정 메뉴에서 직접 수행할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제8조 쿠키 및 추적 기술 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제8조 쿠키 및 추적 기술
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              LuminSight는 사용 편의성과 서비스 개선을 위해 쿠키를 사용합니다. 사용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              단, 쿠키 거부 시 일부 서비스 기능이 제한될 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제9조 정책 변경 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제9조 정책 변경
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              회사는 필요에 따라 개인정보처리방침을 변경할 수 있으며, 변경 사항은 서비스 내에 공지됩니다. 중대한 변경의 경우 메일 또는 기타 방식으로 사전 공지합니다.
            </p>
          </div>
        </section>

        {/* 제10조 문의처 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제10조 문의처
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              개인정보 처리와 관련하여 문의사항이 있으시면 다음으로 연락주시기 바랍니다:
            </p>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ece9f5' }}>
              <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>이메일:</span> privacy@luminsight.app
              </p>
              <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '8px' }}>
                <span style={{ color: '#8b7fd4', fontWeight: 700 }}>고객지원:</span> support@luminsight.app
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: '#a29bb0', fontSize: '14px', lineHeight: 1.8 }}>
            LuminSight는 사용자의 개인정보를 소중히 여기며, 이를 안전하게 보호하기 위해 최선을 다합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
