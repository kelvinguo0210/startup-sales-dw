import moment from 'moment';

const formatDate2: any = (date: string | number) => {
  if (!date) {
    return '';
  }
  return moment(date).format('YYYY-MM');
};

export default formatDate2;
