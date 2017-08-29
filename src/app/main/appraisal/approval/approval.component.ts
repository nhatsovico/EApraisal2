import { Component, OnInit, ViewChild } from '@angular/core';

import { IMyDpOptions } from 'mydatepicker';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { AuthenService } from '../../../core/services/authen.service';
import { DataService } from '../../../core/services/data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HandleErrorService } from '../../../core/services/handle-error.service';
import { UtilityService } from '../../../core/services/utility.service';
import { LoggedInUser } from '../../../core/domain/loggedin.user';
import { MessageConstants } from '../../../core/common/message.constants';
import { UrlConstants } from '../../../core/common/url.constants';
import { ArrayConstants } from '../../../core/common/array.constants';

@Component({
  selector: 'app-approval',
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.css']
})
export class ApprovalComponent implements OnInit {
  @ViewChild('approveAppraisalModal') public approveAppraisalModal: ModalDirective;
  approveLoading: Boolean = false;
  pageIndex: number = 1;
  pageSize: number = 10;
  totalRow: number;
  filter: string = '';
  maxSize: number = 10;
  appraisals: any[];
  // appraisal: any;
  appraisalApproval: any;
  currentUser: LoggedInUser;
  departmentList = [];
  categoryList = [];
  temporarydate;
  supervisoryChevron = false;
  supervisoryToggle = false;
  leadershipChevron = false;
  leadershipToggle = false;
  partAShow: string[];
  partBShow: string[];
  partCShow: string[];

  constructor(private _authenService: AuthenService, private _dataService: DataService, private _handleErrorService: HandleErrorService,
    private _utilityService: UtilityService, private _notificationService: NotificationService
  ) {
    this.currentUser = _authenService.getLoggedInUser();
  }

  ngOnInit() {
    this.categoryList = JSON.parse(this.currentUser.categoryList);
    this.loadData();
  }

  private myDatePickerOptions: IMyDpOptions = {
    // other options...
    dateFormat: 'dd/mm/yyyy',
  };

  loadData() {
    this._dataService.get('/api/appraisal/GetNeedYourAppraisalApprovalListPaging?pageIndex=' + this.pageIndex + '&pagesize=' + this.pageSize + '&filter=' + this.filter)
      .subscribe((response: any) => {
        this.appraisals = response.Items;
        this.appraisals.forEach(element => {
          element.StatusName = JSON.parse(this.currentUser.statusList).filter(a => a.Value == element.StatusId)[0].Text;
        });
        // console.log(this.appraisals);
        this.pageIndex = response.PageIndex;
        this.pageSize = response.PageSize;
        this.totalRow = response.TotalRow;
      }, error => this._handleErrorService.handleError(error));
  }

  pageChanged(event: any): void {
    // debugger
    this.pageIndex = event.page;
    this.loadData();
  }

  loadAppraisal(Id: any) {
    this._dataService.get('/api/appraisal/getAppraisal/' + Id).subscribe((response: any) => {
      // alert(JSON.stringify(this.currentUser.categoryList) + JSON.stringify(this.appraisal.categoryId));
      // this.appraisal = {};
      this.appraisalApproval = {};
      this.appraisalApproval = response;
      this.appraisalApproval.AppraisalId = response.Id;
      this.appraisalApproval.AppraiseeId = response.UserId;
      this.appraisalApproval.reviewerName = this.currentUser.fullName;
      this.appraisalApproval.reviewerTitle = this.currentUser.jobTitle;
      this.appraisalApproval.departmentEnName = JSON.parse(this.currentUser.departmentList).filter(a => a.Value == this.appraisalApproval.DepartmentId)[0].Text;
      this.appraisalApproval.categoryName = JSON.parse(this.currentUser.categoryList).filter(a => a.Value == this.appraisalApproval.CategoryId)[0].Text;
      let fromDate = new Date(this.appraisalApproval.From);
      this.appraisalApproval.From = fromDate.getDate() + '/' + (fromDate.getMonth() + 1) + '/' + fromDate.getFullYear();
      let toDate = new Date(this.appraisalApproval.To);
      this.appraisalApproval.To = toDate.getDate() + '/' + (toDate.getMonth() + 1) + '/' + toDate.getFullYear();
      let reviewDate = new Date(this.appraisalApproval.ReviewDate)
      // console.log(this.appraisalApproval);
      this.temporarydate = { date: { year: reviewDate.getFullYear(), month: reviewDate.getMonth() + 1, day: reviewDate.getDate() } };

      this.partAShow = ArrayConstants.NON_SUPERVISOR_LEVEL;
      this.partBShow = ArrayConstants.SUPERVISOR_LEVEL;
      this.partCShow = ArrayConstants.LEADER_LEVEL;
      if (this.partAShow.includes(this.appraisalApproval.EmployeeLvId)) {
        this.supervisoryToggle = true;
        this.leadershipToggle = true;
      }
      else if (this.partBShow.includes(this.appraisalApproval.EmployeeLvId)) {
        this.leadershipToggle = true;
      }
    }, error => this._handleErrorService.handleError(error));
  }

  showApproveAppraisalModal(appraisalId: number) {
    this.loadAppraisal(appraisalId);
    this.approveAppraisalModal.show();

  }

  approveAppraisal(valid: Boolean) {
    if (!valid || this.appraisalApproval.AppraisalId == undefined) return;

    if (this.appraisalApproval.statusId == 'V') {
      this._notificationService.printConfirmationDialog(MessageConstants.CONFIRM_REJECT_APPRAISAL_MSG, () => {
        this.approveLoading = true;
        this.saveApproval();
      });
    } else {
      this.approveLoading = true;
      this.saveApproval();
    }
  }

  saveApproval() {
    // this.appraisalApproval.AppraisalId = this.appraisal.Id;
    // this.appraisalApproval.AppraiseeId = this.appraisal.UserId;
    // Date problem
    let _appraisalMonth = this.temporarydate.date.month.toString().length < 2 ? '0' + this.temporarydate.date.month : this.temporarydate.date.month;
    let _appraisalDay = this.temporarydate.date.day.toString().length < 2 ? '0' + this.temporarydate.date.day : this.temporarydate.date.day;
    let _reviewDate: string = this.temporarydate.date.year + '-' + _appraisalMonth + '-' + _appraisalDay + 'T15:00:00Z'
    this.appraisalApproval.reviewDate = new Date(_reviewDate);
    // End Date problem

    this._dataService.post('/api/AppraisalApproval/SaveAppraisalApproval', this.appraisalApproval).subscribe((response: any) => {
      if (this.appraisalApproval.statusId == 'V') {
        this._notificationService.printSuccessMessage(MessageConstants.REJECT_SUCCESS);
      } else {
        this._notificationService.printSuccessMessage(MessageConstants.APPROVE_SUCCESS);
      }
      this.approveLoading = false;
      this.approveAppraisalModal.hide();
      this.loadData();
    }, error => {
      // alert(JSON.stringify(error));
      if (JSON.parse(error._body).Message == "Approve succeeded but we cannot send mail.") {
        this._notificationService.printSuccessMessage("Approve succeeded but we cannot send mail.");
        this.loadData();
        this.approveAppraisalModal.hide();
      }
      else if (JSON.parse(error._body).Message == "Reject succeeded but we cannot send mail.") {
        this._notificationService.printSuccessMessage("Reject succeeded but we cannot send mail.");
        this.loadData();
        this.approveAppraisalModal.hide();
      }
      else {
        this._handleErrorService.handleError(error);
      }
      this.approveLoading = false;
    });
  }

  supervisoryClick() {
    this.supervisoryChevron = !this.supervisoryChevron;
  }

  leadershipClick(){
    this.leadershipChevron = !this.leadershipChevron;
  }

    // Generate conclusion

    generateSubTotal1() {
      let noCompetencies = 0;
      if (this.appraisalApproval.CustomerDriven > 0) noCompetencies++;
      if (this.appraisalApproval.QuestForExcellence > 0) noCompetencies++;
      if (this.appraisalApproval.TeamWork > 0) noCompetencies++;
      if (this.appraisalApproval.RespectAndTrust > 0) noCompetencies++;
      if (this.appraisalApproval.Enterprising > 0) noCompetencies++;
      if (this.appraisalApproval.Communication > 0) noCompetencies++;
      if (this.appraisalApproval.Dependability > 0) noCompetencies++;
      if (this.appraisalApproval.QuantityOfWork > 0) noCompetencies++;
      if (this.appraisalApproval.QualityOfWork > 0) noCompetencies++;
  
      if (this.appraisalApproval.PersonalEfficiency > 0) noCompetencies++;
      if (this.appraisalApproval.WorkforceScheduling > 0) noCompetencies++;
      if (this.appraisalApproval.QualityManagement > 0) noCompetencies++;
      if (this.appraisalApproval.PerformanceManagement > 0) noCompetencies++;
      if (this.appraisalApproval.SuccessionPlanning > 0) noCompetencies++;
      if (this.appraisalApproval.ManagingConflicts > 0) noCompetencies++;
      if (this.appraisalApproval.CelebrateResults > 0) noCompetencies++;
      if (this.appraisalApproval.LeadWithVision > 0) noCompetencies++;
      if (this.appraisalApproval.AlignAndEngage > 0) noCompetencies++;
      if (this.appraisalApproval.TalentMagnet > 0) noCompetencies++;
  
      this.appraisalApproval.SubTotal1 = (noCompetencies == 0) ? 0 : (
        this.appraisalApproval.CustomerDriven +
        this.appraisalApproval.QuestForExcellence +
        this.appraisalApproval.TeamWork +
        this.appraisalApproval.RespectAndTrust +
        this.appraisalApproval.Enterprising +
        this.appraisalApproval.Communication +
        this.appraisalApproval.Dependability +
        this.appraisalApproval.QuantityOfWork +
        this.appraisalApproval.QualityOfWork +
  
        this.appraisalApproval.PersonalEfficiency +
        this.appraisalApproval.WorkforceScheduling +
        this.appraisalApproval.QualityManagement +
        this.appraisalApproval.PerformanceManagement +
        this.appraisalApproval.SuccessionPlanning +
        this.appraisalApproval.ManagingConflicts +
        this.appraisalApproval.CelebrateResults +
  
        this.appraisalApproval.LeadWithVision +
        this.appraisalApproval.AlignAndEngage +
        this.appraisalApproval.TalentMagnet)
        / noCompetencies;
  
      this.appraisalApproval.Conclusion = this.appraisalApproval.SubTotal1 * 0.3 + this.appraisalApproval.SubTotal2 * 0.7
    }
  
    generateSubTotal2() {
      let noGoals = 0;
      if (this.appraisalApproval.Goal1 > 0) noGoals++;
      if (this.appraisalApproval.Goal2 > 0) noGoals++;
      if (this.appraisalApproval.Goal3 > 0) noGoals++;
      if (this.appraisalApproval.Goal4 > 0) noGoals++;
      this.appraisalApproval.SubTotal2 = (noGoals == 0) ? 0 : (this.appraisalApproval.Goal1 + this.appraisalApproval.Goal2 + this.appraisalApproval.Goal3 + this.appraisalApproval.Goal4) / noGoals;
  
      this.appraisalApproval.Conclusion = this.appraisalApproval.SubTotal1 * 0.3 + this.appraisalApproval.SubTotal2 * 0.7
    }

    // End of Generate conclusion

    uncheckGoal(name: string) {
      switch (name) {
        case 'goal1':
          this.appraisalApproval.Goal1 = 0; this.generateSubTotal2(); break;
        case 'goal2':
          this.appraisalApproval.Goal2 = 0; this.generateSubTotal2(); break;
        case 'goal3':
          this.appraisalApproval.Goal3 = 0; this.generateSubTotal2(); break;
        case 'goal4':
          this.appraisalApproval.Goal4 = 0; this.generateSubTotal2(); break;
        default: return;
      }
  
    }
}



